import $ from 'jquery';
import { Product } from './interfaces';


// Backend API base URL
const backendApiUrl = "http://localhost:3000/api";


/**
 * Save product data to the backend and handle success/error internally.
 * @param product The product object to save.
 */
export function saveScanItem(product: Product): void {
    const requestData = {
        name: product.product_name,
        ean: $('#eanInput').val() as string, 
        ecoScore: product.ecoscore_score,
        ecoScoreCategory: product.ecoscore_grade,
        nutriScore: product.nutriscore_score,
        nutriScoreCategory: product.nutrition_grades,
        nutrition: {
            Calories: product.nutriments?.["energy-kcal"],
            proteins: product.nutriments?.proteins,
            carbohydrates: product.nutriments?.carbohydrates,
            fat: product.nutriments?.fat,
            sugars: product.nutriments?.sugars,
            fiber: product.nutriments?.fiber,
            sodium: product.nutriments?.sodium,
        }
    };

    $.ajax({
        url: `${backendApiUrl}/scanItem`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: (response) => {
            console.log('Product saved successfully:', response);
        },
        error: (error) => {
            console.error('Error saving product:', error);
        }
    });
}


/**
 * Fetch a scan item from the backend.
 * @returns A Promise that resolves to the list of all scan items.
 */
export function getScanItems(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${backendApiUrl}/scanItem`, 
            method: 'GET',
            dataType: 'json',
            success: (data) => {
                resolve(data);
            },
            error: (error) => {
                console.error('Error fetching scan items:', error);
                reject(error);
            }
        });
    });
}