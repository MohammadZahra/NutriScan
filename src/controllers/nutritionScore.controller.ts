import { Request, Response } from 'express';
import { prisma } from "../server";


const getNutritionScoreAverage = async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
    
        const categories = await prisma.scanItems.groupBy({
            by: ['nutriScoreCategory'],
            where: {
                userId: userId 
            },
            _count: {
                nutriScoreCategory: true
            },
            orderBy: {
                nutriScoreCategory: 'desc'
            }
        });

        const formattedScores = categories.map(category => ({
            category: category.nutriScoreCategory,
            count: category._count.nutriScoreCategory
        }));

        res.status(200).json(formattedScores);
        
    } catch (error) {
        console.error("Error retrieving scan items:", error);
        res.status(500).json({ error: "Error retrieving items" });
    }
};


export default {
    getNutritionScoreAverage,
};