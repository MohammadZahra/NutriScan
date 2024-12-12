import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Product, ApiResponse, Nutriments } from './interfaces';
import { saveScanItem, getScanItems } from './apiService';


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
      <h2>Nutrition Facts</h2>
      <div class="card mt-4 mb-4 shadow">
          <div class="card-header bg-dark text-light">
              <h5>${product.product_name || 'N/A'}</h5>
          </div>
          <div class="card-body">
              <div class="row">
                  <div class="col-md-3">
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
                  <div class="col-md-5">
                        <div class="table-responsive rounded">
                            <table class="table table-striped table-bordered">
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
        success: (data: ApiResponse) => {
            if (data.status === 1 && data.product) {
                // console.log('Product retrieved:', data.product);
                displayProductData(data.product);
                saveScanItem(data.product);
            } else {
                $('#output').text('Product information not available.');
            }
        },
        error: () => {$('#output').text('Error retrieving product information.');}
    });
}


function setupEventListeners() {
    // displayScanHistory();
    $('form').on('submit', (event) => {
        event.preventDefault();  
        const ean = $('#eanInput').val() as string;
        processEAN(ean);
    });

    $("#scanButton").on("click", () => {
        initializeQrcodeScanner();
    });
}

$(setupEventListeners);



