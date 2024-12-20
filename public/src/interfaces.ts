
/** DEFINE INTERFACES **/
/***********************/
export interface ApiResponse {
    product?: Product;
    status: number;
    status_verbose: string;
}

export interface Product {
    product_name?: string;
    ean?: string;
    image_url?: string;
    nutriscore_score?: number;
    nutrition_grades?: string;
    ecoscore_score?: number;
    ecoscore_grade?: string;
    nutriments?: Nutriments;
    ingredients_text?: string;
    allergens_tags?: string[];
}

export interface Nutriments {
    "energy-kcal"?: number;
    proteins?: number;
    carbohydrates?: number;
    fat?: number;
    sugars?: number;
    fiber?: number;
    sodium?: number;
}

export interface ScanItemRequest {
    name: string;
    ean: string;
    ecoScore: number;
    ecoScoreCategory: string;
    nutriScore: number;
    nutriScoreCategory: string;
    content: string;
    nutrition: Nutriments;
}

export interface ScanItemResponse {
    id: number;
    name: string;
    ean: string;
    ecoScore: number;
    ecoScoreCategory: string;
    nutriScore: number;
    nutriScoreCategory: string;
    content: string;
    nutrition: NutrimentsResponse;
    createdAt: Date;
    updatedAt: Date;
}

export interface NutrimentsResponse {       
    value: number;    
    name: string;
}