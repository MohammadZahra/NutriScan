import { Request, Response } from 'express';
import { prisma } from "../server";



const createScanItem = async (req: Request, res: Response) => {
    const { name, ean, ecoScore, ecoScoreCategory, nutriScore, nutriScoreCategory, content, nutrition } = req.body;
    try {

        const nutritionArray = Object.entries(nutrition).map(([key, value]) => ({ name: key, value: value as number }));
        const userId = req.session.userId;

        const newScanItem = await prisma.scanItems.create({
            data: {
                name,
                ean,
                ecoScore,
                ecoScoreCategory,
                nutriScore,
                nutriScoreCategory,
                content,
                nutrition: {
                    create: nutritionArray,
                },
                userId,
            },
            include: {
                nutrition: true,
            }
        });
        res.status(200).json({
            item: newScanItem,
        });
    } catch (e) {
        res.status(500).json({ error: e });
    }
};


const getScanItem = async (req: Request, res: Response) => {
    try {
        
        const userId = req.session.userId;

        const scanItems = await prisma.scanItems.findMany({
            where: { userId },
            include: {
                nutrition: true
            }
        });
    
        res.status(200).json({
            items: scanItems,
        });
    } catch (error) {
        console.error("Error retrieving scan items:", error);
        res.status(500).json({ error: "Error retrieving items" });
    }
};



export default {
    createScanItem,
    getScanItem
};


