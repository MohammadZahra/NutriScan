import express from 'express';
import scanItemController from "../controllers/scanItem.controller"; 

const router = express.Router();


router.get('/', scanItemController.getScanItems);

router.post('/', scanItemController.createScanItem);



export default router;
