import 'bootstrap';
import $, { data, get } from 'jquery';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Product, ApiResponse, ScanItemResponse } from './interfaces';
import { saveScanItem, getScanItems, getAverageNutritionScore } from './apiService';
import { io } from "socket.io-client";

Chart.register(...registerables);

const socket = io("http://localhost:8000");
let chart: Chart;

/** DISPLAY PRODUCT DATA **/
/**************************/
function generateScoreImage(score: string | undefined, type: string): string {
    if (!score || score.toUpperCase() === 'NOT-APPLICABLE') return '';
    const scoreImagePath = `${type === 'nutriscore' ? 'misc' : 'attributes'}/${type}-${score.toLowerCase()}`;
    const imageUrl = `https://static.openfoodfacts.org/images/${scoreImagePath}.png`;
    return `<img src="${imageUrl}" class="img-fluid" style="max-width: 70px;">`;
}

function displayProductData(product: Product): void {
    const nutriments = product.nutriments || {};
    const ecoScoreImage = generateScoreImage(product.ecoscore_grade, 'ecoscore');
    const nutriScoreImage = generateScoreImage(product.nutrition_grades, 'nutriscore');

    const productInfoHTML = `
        <hr class="my-4">
        <h3>Nutrition Facts</h3>
        <div class="card mt-4 mb-4 shadow">
        <div class="card-header bg-dark text-light">
            <h5>${product.product_name || 'N/A'}</h5>
        </div>
        <div class="card-body">
            <div class="row g-4">
            <!-- Left Column: Image and Scores -->
            <div class="col-md-4 text-center">
                <img src="${product.image_url || ''}" alt="${product.product_name || 'Product Image'}"
                    class="img-fluid mb-3" style="max-height: 250px; width: auto;">
                <p><strong>Eco-Score:</strong> ${product.ecoscore_grade?.toUpperCase() || 'Unavailable'}</p>
                ${ecoScoreImage || ''}
                <p><strong>Nutri-Score:</strong> ${product.nutrition_grades?.toUpperCase() || 'Unavailable'}</p>
                ${nutriScoreImage || ''}
            </div>
            <!-- Right Column: Nutrition Table -->
            <div class="col-md-8">
                <button id="addItem" class="btn btn-primary mb-3">Add item</button>
                <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <tbody>
                    ${nutriments['energy-kcal'] ? `<tr><th>Calories</th><td>${nutriments['energy-kcal']} kcal</td></tr>` : ''}
                    ${nutriments.proteins ? `<tr><th>Proteins</th><td>${nutriments.proteins} g</td></tr>` : ''}
                    ${nutriments.carbohydrates ? `<tr><th>Carbohydrates</th><td>${nutriments.carbohydrates} g</td></tr>` : ''}
                    ${nutriments.fat ? `<tr><th>Fats</th><td>${nutriments.fat} g</td></tr>` : ''}
                    ${nutriments.sugars ? `<tr><th>Sugars</th><td>${nutriments.sugars} g</td></tr>` : ''}
                    ${nutriments.fiber ? `<tr><th>Fiber</th><td>${nutriments.fiber} g</td></tr>` : ''}
                    ${nutriments.sodium ? `<tr><th>Sodium</th><td>${nutriments.sodium} mg</td></tr>` : ''}
                    ${product.ingredients_text ? `<tr><th>Ingredients</th><td>${product.ingredients_text}</td></tr>` : ''}
                    ${product.allergens_tags?.length ? `<tr><th>Allergens</th><td>${product.allergens_tags.map(allergen => allergen.replace('en:', '')).join(', ')}</td></tr>` : ''}
                    </tbody>
                </table>
                </div>
            </div>
            </div>
        </div>
        </div>`;

    $('#output').html(productInfoHTML);
}

function generateScannedItemHtml(item: ScanItemResponse): string {
    
    const nutritionRows = Array.isArray(item.nutrition)
        ? item.nutrition.map(nutrient => {
            const unit = nutrient.name.toLowerCase() === "calories" ? "kcal" : "g";
            return `<tr><th class="small">${nutrient.name}</th><td>${nutrient.value} ${unit}</td></tr>`;
        }).join("")
        : '<tr><td class="small" colspan="2">No nutrition data available</td></tr>';

    return `
        <div class="card mb-2 ">
            <div class="card-body">
                <p class="mb-0">
                    <strong class="card-title">${item.name || 'Item Name Unavailable'}</strong> - <span>Barcode: ${item.ean}</span>
                    <p class="text-muted small">Scanned on: ${new Date(item.createdAt).toLocaleString()}</p>
                </p>
                
                <details> 
                    <summary>View Details</summary>
                    <div class="row mt-3 mb-3">
                        <div class="col-6 small">
                            <strong>Eco-Score:</strong> ${item.ecoScore} <br>
                            <strong>Eco-Score Category:</strong> ${item.ecoScoreCategory}
                        </div>
                        <div class="col-6 small">
                            <strong>Nutri-Score:</strong> ${item.nutriScore} <br>
                            <strong>Nutri-Score Category:</strong> ${item.nutriScoreCategory}
                        </div>
                    </div>
                    <div class="table-responsive ">
                        <table class="table table-sm table-striped ">
                            <tbody>
                                ${nutritionRows}
                            </tbody>
                        </table>
                    </div>
                </details> 

            </div>
        </div>
    `;
}


/** PROCESS SCANNER AND INPUT **/
/*******************************/
function initializeQrcodeScanner() {
    const scanner = new Html5QrcodeScanner(
        "qrCodeScanner",
        { fps: 10, qrbox: { width: 400, height: 400 } },
        false
    );
    scanner.render(
        (decodedText, decodedResult) => { //onScanSuccess
            console.log(`Code matched: ${decodedText}`, decodedResult);
            $('#eanInput').val(decodedText);
            processEAN(decodedText);
            scanner.clear();
        },
        (error) => { //onScanFailure
            console.log(`Code scan error: ${error}`);
        }
    );
}


function renderPieChart(
    canvasId: string,
    labels: string[],
    data: number[],
    colors: string[]
): Chart {
    // Get the canvas element
    const ctx = (document.getElementById(canvasId) as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) {
        throw new Error("Canvas element not found");
    }
    // Chart configuration
    const chartConfig: ChartConfiguration = {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: data,
                backgroundColor: colors,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true, // Makes the chart responsive
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        sort: (a, b) => a.text.localeCompare(b.text), // Sort legend labels alphabetically
                    }
                },
                tooltip: {
                    enabled: true,
                }
            }
        }
    };
    // Create and return the chart
    return new Chart(ctx, chartConfig);
}


function processEAN(ean: string | null): void {
    if (!ean) {
        $('#output').text('Please enter or scan a valid EAN code.');
        return;
    }
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,image_url,nutriscore_score,nutrition_grades,ecoscore_score,ecoscore_grade,nutriments,ingredients_text,allergens_tags`;

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: (response: ApiResponse) => {
            const product = response.product;
            if (response.status === 1 && product) {
                displayProductData(product);
                $("#addItem").on("click", () => saveScanItem(product));
            } else {
                $('#output').text('Product information not available.');
            }
        },
        error: () => { $('#output').text('Error retrieving product information.'); }
    });
}


async function displayScannedItems(): Promise<void> {
    const response = await getScanItems();
    const items = response.items;

    if(items.length > 0){
        $("#scannedItems").parent().show();
        $("#output").parent().removeClass("col-md-12").addClass("col-md-6");
        $("#chartId").show();
    }

    items.forEach((item: ScanItemResponse) => {
        $('#scannedItems').append(generateScannedItemHtml(item));
    });
}


async function initializeChart() {
    const response = await getAverageNutritionScore();
    const labels = response.map(item => item.category);
    const data = response.map(item => item.count);
    const colors = ['yellow', 'aqua', 'pink', 'lightgreen', 'gold', 'lightblue'];

    try {
        chart = renderPieChart('chartId', labels, data, colors);
    } catch (error) {
        console.error(error);
    }
}


/** EVENT LISTENERS  **/
/**********************/
socket.on('updateItems', (item) => {
    console.log('Received new Item:', item);
    $("#scannedItems").parent().show();
    $("#output").parent().removeClass("col-md-12").addClass("col-md-6");
    $('#scannedItems').prepend(generateScannedItemHtml(item));
});


socket.on('updateChart', (category) => {
    console.log('Category increased:', category);
    const index = chart.data.labels?.indexOf(category) ?? -1;
    
    if (index !== -1 && index !== undefined) {  
        const newValue = (chart.data.datasets[0].data[index] as number) + 1;
        chart.data.datasets[0].data[index] = newValue;
    } else {
        chart.data.labels?.push(category);
        chart.data.datasets[0].data.push(1); // Initialize the count to 1
    }

    $("#chartId").show();
    chart.update();
});


function setupEventListeners() {
    displayScannedItems().then(() => initializeChart());
    $("#output").parent().removeClass("col-md-6").addClass("col-md-12");
    
    $('form').on('submit', (event) => {
        event.preventDefault();
        processEAN($('#eanInput').val() as string);
    });

    $("#scanButton").on("click", () => {
        initializeQrcodeScanner();
    });
}


$(setupEventListeners);



