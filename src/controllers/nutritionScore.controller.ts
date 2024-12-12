import { Request, Response } from 'express';
import { prisma } from "../server";

declare module 'express-session' {
    interface SessionData {
        nutritionScoreViews?: number;
    }
}

const getNutritionScoreAverage = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.scanItems.groupBy({
            by: ['nutriScoreCategory'],
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

        res.status(200).json({
            success: true,
            data: formattedScores,
            sessionInfo: {
                viewCount: req.session.nutritionScoreViews,
                lastViewed: new Date()
            }
        });
        
    } catch (error) {
        console.error("Error retrieving scan items:", error);
        res.status(500).json({ error: "Error retrieving items" });
    }
};


export default {
    getNutritionScoreAverage,
};