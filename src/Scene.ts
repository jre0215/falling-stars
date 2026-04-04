import { getDistanceBetweenPoints, Point } from "./Point";
import { Spark } from "./Spark";
import { Star } from "./Star";

import {
    existingFallingStarMinRadius,
    fallingStarCreationInterval,
    fallingStarGravity,
    fallingStarInitialVelocity,
    fixedStarCount,
    fixedStarMaxSize,
    groundColor,
    groundHeight,
    minDistanceBetweenFixedStars,
    newFallingStarMaxRadius,
    newFallingStarMinRadius,
    skyGradientEndColor,
    skyGradientStartColor,
    sparkLifeSpanInFrames,
    starColor,
} from "./constants";

function getRandomIntBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
}

export class Scene {
    private readonly context: CanvasRenderingContext2D;
    private currentFrame = 0;
    private readonly skyGradient: CanvasGradient;
    private readonly fixedStars: Star[] = [];
    private fallingStars: Star[] = [];
    private readonly sparks: Spark[] = [];

    public constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        this.skyGradient = this.context.createLinearGradient(0, 0, 0, this.context.canvas.height);
        this.skyGradient.addColorStop(0, skyGradientStartColor);
        this.skyGradient.addColorStop(1, skyGradientEndColor);
        this.fallingStars.push(this.createFallingStar());
        this.createFixedStars();
    }

    private createFallingStar(): Star {
        const randomX: number = Math.floor(Math.random() * this.context.canvas.width);
        const randomY: number = -Math.floor(Math.random() * (this.context.canvas.height / 4));
        const radius: number = getRandomIntBetween(newFallingStarMinRadius,
            newFallingStarMaxRadius);
        // Generate an angle between 17pi/12 and 19pi/12
        const randomAngle: number = (Math.PI * (17 / 12)) + (Math.random() * (Math.PI / 6));

        return new Star(this.context, randomX, randomY, radius, fallingStarInitialVelocity,
            randomAngle, fallingStarGravity, this.sparks);
    }

    private generateRandomPointsForFixedStars(): Point[] {
        const points: Point[] = [];
        while (points.length < fixedStarCount) {
            const randomX: number = Math.floor(Math.random() * this.context.canvas.width);
            const randomY: number =
                Math.floor(Math.random() * (this.context.canvas.height - groundHeight));
            const randomPoint: Point = new Point(
                clamp(randomX, 20, this.context.canvas.width - 20),
                clamp(randomY, 20, this.context.canvas.height - groundHeight - 20),
            );
            let usePoint = true;
            for (const existingPoint of points) {
                if (getDistanceBetweenPoints(existingPoint, randomPoint) <
                    minDistanceBetweenFixedStars) {
                    usePoint = false;
                    break;
                }
            }
            if (usePoint) {
                points.push(randomPoint);
            }
        }

        return points;
    }

    private createFixedStars(): void {
        const randomPoints: Point[] = this.generateRandomPointsForFixedStars();
        for (const point of randomPoints) {
            const radius: number = Math.ceil(Math.random() * fixedStarMaxSize);
            this.fixedStars.push(
                new Star(this.context, point.x, point.y, radius, 0, 0, 0, this.sparks),
            );
        }
    }

    public update(): void {
        this.currentFrame++;
        if (this.currentFrame % fallingStarCreationInterval === 0) {
            this.fallingStars.push(this.createFallingStar());
        }
        for (const star of this.fixedStars) {
            star.update();
        }
        for (const star of this.fallingStars) {
            star.update();
        }
        for (const spark of this.sparks) {
            spark.update();
        }
        // Remove falling stars that have become too small
        this.fallingStars = this.fallingStars.filter(
            (star: Star) => star.radius >= existingFallingStarMinRadius);
        // Remove sparks that are too old
        while (true) {
            let removedSpark = false;
            for (let i = 0; i < this.sparks.length; i++) {
                if (this.sparks[i].currentFrame > sparkLifeSpanInFrames) {
                    this.sparks.splice(i, 1);
                    removedSpark = true;
                    break;
                }
            }
            if (!removedSpark) {
                break;
            }
        }
    }

    public draw(): void {
        this.context.fillStyle = this.skyGradient;
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        this.context.fillStyle = starColor;
        for (const star of this.fixedStars) {
            star.draw();
        }

        this.context.fillStyle = groundColor;
        this.context.shadowBlur = 0;
        this.context.fillRect(0, this.context.canvas.height - groundHeight + 1,
            this.context.canvas.width, groundHeight);

        for (const star of this.fallingStars) {
            star.draw();
        }
        for (const spark of this.sparks) {
            spark.draw();
        }
    }
}
