import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from "html5-qrcode";


/** DEFINE INTERFACES **/
/***********************/
interface ApiResponse {
    product?: Product;
    status: number;
    status_verbose: string;
}
interface Product {
    product_name?: string;
    image_url?: string;
    nutrition_grades?: string;
    ecoscore_grade?: string;
    nutriments?: Nutriments;
    ingredients_text?: string;
    allergens_tags?: string[];
}
interface Nutriments {
    "energy-kcal"?: number;
    proteins?: number;
    carbohydrates?: number;
    fat?: number;
    sugars?: number;
    fiber?: number;
    sodium?: number;
}


/** DISPLAY PRODUCT DATA **/
/**************************/
function generateScoreImage(score: string | undefined, type: string): string {
    if (!score || score.toUpperCase() === 'NOT-APPLICABLE') return '';
    const scoreImagePath = `${type === 'nutriscore' ? 'misc' : 'attributes'}/${type}-${score.toLowerCase()}`;
    const imageUrl = `https://static.openfoodfacts.org/images/${scoreImagePath}.png`;
    return `<img src="${imageUrl}" class="img-fluid" style="max-width: 70px;">`;
}

function displayProductData(product: Product): void {
    const ecoScoreImage = generateScoreImage(product.ecoscore_grade, 'ecoscore');
    const nutriScoreImage = generateScoreImage(product.nutrition_grades, 'nutriscore');

    const productInfoHTML = `
      <hr class="my-4">
      <h2>Nutrition Facts</h2>
      <div class="card mt-4 mb-4 shadow">
          <div class="card-header bg-dark text-light">
              <h5>${product.product_name || 'N/A'}</h5>
          </div>
          <div class="card-body">
              <div class="row">
                  <div class="col-sm-4">
                      <img src="${product.image_url || ''}" alt="${product.product_name || ''}" class="img-fluid mb-3" style="max-width: 150px; max-height: 250px;">
                      <div class="mb-4">
                          <p><strong>Eco-Score:</strong> ${product.ecoscore_grade?.toUpperCase() || 'unavailable'}</p>
                          ${ecoScoreImage}
                      </div>
                      <div class="mb-4">
                          <p><strong>Nutri-Score:</strong> ${product.nutrition_grades?.toUpperCase() || 'unavailable'}</p>
                          ${nutriScoreImage}
                      </div>
                  </div>
                  <div class="col-sm-8">
                        <div class="table-responsive rounded">
                            <table class="table table-striped table-bordered">
                                <tbody>
                                    ${product.nutriments?.['energy-kcal'] ? `<tr><th>Calories</th><td>${product.nutriments['energy-kcal']} kcal</td></tr>` : ''}
                                    ${product.nutriments?.proteins ? `<tr><th>Proteins</th><td>${product.nutriments.proteins} g</td></tr>` : ''}
                                    ${product.nutriments?.carbohydrates ? `<tr><th>Carbohydrates</th><td>${product.nutriments.carbohydrates} g</td></tr>` : ''}
                                    ${product.nutriments?.fat ? `<tr><th>Fats</th><td>${product.nutriments.fat} g</td></tr>` : ''}
                                    ${product.nutriments?.sugars ? `<tr><th>Sugars</th><td>${product.nutriments.sugars} g</td></tr>` : ''}
                                    ${product.nutriments?.fiber ? `<tr><th>Fiber</th><td>${product.nutriments.fiber} g</td></tr>` : ''}
                                    ${product.nutriments?.sodium ? `<tr><th>Sodium</th><td>${product.nutriments.sodium} mg</td></tr>` : ''}
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
            $("#qrCodeScanner").hide();
        },
        (error) => { //onScanFailure
            console.log(`Code scan error: ${error}`);
        }
    );
}

function processEAN(ean: string | null): void {
    if (!ean) {
        $('#output').text('Please enter or scan a valid EAN code.');
        return;
    }

    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,image_url,nutrition_grades,ecoscore_grade,nutriments,ingredients_text,allergens_tags`;

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: (data: ApiResponse) => {
            if (data.status === 1 && data.product) {
                displayProductData(data.product);
            } else {
                $('#output').text('Product information not available.');
            }
        },
        error: () => {$('#output').text('Error retrieving product information.');}
    });
}

function setupEventListeners() {
    $('#searchButton').on('click', () => {
        const ean = $('#eanInput').val() as string;
        processEAN(ean);
    });
    $("#scanButton").on("click", () => {
        $("#qrCodeScanner").show();
        initializeQrcodeScanner();
    });
}

$(setupEventListeners);
