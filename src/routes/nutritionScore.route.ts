import express from 'express';
import nutritionScoreController from "../controllers/nutritionScore.controller"; 

const router = express.Router();


router.get('/average', nutritionScoreController.getNutritionScoreAverage);



export default router;