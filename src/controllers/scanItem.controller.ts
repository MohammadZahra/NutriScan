import { Request, Response } from 'express';
import { prisma } from "../server";
import { getSocketIO } from '../socket';


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

        let io = getSocketIO();
        io.emit("updateItems", newScanItem);
        io.emit("updateChart", nutriScoreCategory);

        res.status(200).json({
            item: newScanItem,
        });

    } catch (error) {
        console.error("Error creating scan items:", error);
        res.status(500).json({ error: "Error creating item" });
    }
};


const getScanItems = async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
        const scanItems = await prisma.scanItems.findMany({
            where: { userId },
            include: { nutrition: true }
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
    getScanItems
};

