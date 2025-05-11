import { createCanvas, loadImage } from 'canvas';
import { generateAndSaveBarcode, findBarcodeByNumber, deleteBarcode } from '../utils/barcodeGenerator.js';
import { Member } from '../models/member.model.js';
import { Membership } from '../models/membership.model.js';
import { sendMail } from '../utils/sendMail.js';
import cloudinary from '../utils/cloudinaryConfig.js';


export const generateIdCard = async (name, id, dob, type, validUpto, memberPhotoPath) => {
    console.log('generating ID card for', name);
    try {
        // Find the member and membership records
        const membership = await Membership.findOne({ memberId: id });
        if (!membership) {
            throw new Error('Membership not found');
        }
        const member = await Member.findOne({ email: membership.email, phone: membership.phone });
        if (!member) {
            throw new Error('Member not found');
        }

        // Get the member photo URL from the database
        const memberPhotoUrl = member.photo;
        if (!memberPhotoUrl) {
            throw new Error('Member photo not found');
        }

        // Find or generate the barcode for the ID
        let barcodeUrl;
        const existingBarcode = await findBarcodeByNumber(id);
        if (existingBarcode) {
            barcodeUrl = existingBarcode;

        } else {
            barcodeUrl = await generateAndSaveBarcode(id);
        }
        if (!barcodeUrl) {
            throw new Error('Barcode not found or could not be generated');
        }





        // Create a canvas for the portrait ID card
        const canvas = createCanvas(400, 600);
        const ctx = canvas.getContext('2d');

        // Helper function: Draw a rounded rectangle
        const drawRoundedRect = (ctx, x, y, width, height, radius) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.clip();
        };

        // Set background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 400, 600);

        // Branding and member details
        ctx.fillStyle = '#006600';
        ctx.font = '900 50px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('INL', 20, 60);
        ctx.font = '600 20px Arial, sans-serif';
        ctx.fillText('INDIAN SECULAR FRONT', 20, 85);

        ctx.fillStyle = '#333333';
        ctx.font = '500 30px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('MEMBER', 335, 50);
        ctx.fillStyle = '#006600';
        ctx.font = '800 40px Arial, sans-serif';
        ctx.fillText('ID', 380, 55);

        const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';
            let lines = [];

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            return lines;
        };

        // Member details
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'left';

        // Handle name
        let fontSize = 28;
        let nameLines = [name];
        const maxWidth = 220; // Maximum width for the name

        // Reduce font size and wrap text if name is too long
        while (fontSize > 18) {
            ctx.font = `600 ${fontSize}px Arial, sans-serif`;
            nameLines = wrapText(ctx, name, 160, 200, maxWidth, 30);
            if (nameLines.length <= 2 && ctx.measureText(nameLines[0]).width <= maxWidth) {
                break;
            }
            fontSize -= 2;
        }

        // Draw name
        let yPosition = 200;
        nameLines.forEach((line) => {
            ctx.fillText(line, 160, yPosition);
            yPosition += fontSize + 5;
        });

        // Adjust positions of other details based on name height
        const nameHeight = nameLines.length * (fontSize + 5);
        
        ctx.font = '500 26px Arial, sans-serif';
        ctx.fillText(`ID: ${id}`, 160, 200 + nameHeight + 10);
        
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText(`DOB: ${dob}`, 160, 200 + nameHeight + 50);

        // Load images from Cloudinary URLs
        const [memberImage, barcode] = await Promise.all([
            loadImage(memberPhotoUrl).catch(error => {
                console.error('Error loading member photo:', error);
                throw new Error('Failed to load member photo');
            }),
            loadImage(barcodeUrl).catch(error => {
                console.error('Error loading barcode:', error);
                throw new Error('Failed to load barcode');
            })
        ]);
        // Draw member photo
        ctx.save();
        drawRoundedRect(ctx, 20, 160, 120, 150, 15);
        ctx.drawImage(memberImage, 20, 160, 120, 150);
        ctx.restore();

        // Draw barcode
        ctx.drawImage(barcode, 20, 355, 360, 130);

        // Additional details
        ctx.font = '500 12px Arial, sans-serif';
        ctx.fillText(`TYPE: ${type}`, 20, 335);
        ctx.fillText(`VALID UPTO: ${validUpto}`, 130, 335);

        // Footer
        ctx.font = '500 15px Arial, sans-serif';
        ctx.fillText('Indian Secular Front', 20, 550);
        ctx.fillText('Telephone No: 9000000000', 20, 575);

        ctx.fillStyle = '#006600';
        ctx.font = '900 45px Arial, sans-serif';
        ctx.fillText('ISF', 290, 550);
        ctx.fillStyle = '#333333';
        ctx.font = '500 20px Arial, sans-serif';
        ctx.fillText('MEMBER', 290, 580);

        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');

        // Upload ID card to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'isf_id_cards' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        const idCardUrl = result.secure_url;

        // Update the member record with the new ID card URL
        member.idCard = idCardUrl;
        await member.save();

        // Send email with ID card
        await sendMail({
            to: member.email,
            subject: 'Your ISF Membership ID Card',
            text: `Dear ${name},\n\nYour ISF Membership ID Card is ready. You can download it from the following link:\n\n${idCardUrl}\n\nBest regards,\nISF Team`,
            attachments: [
                {
                    filename: `isf_member_id_card_${id}.png`,
                    path: idCardUrl
                }
            ]
        });

        return true;
    } catch (error) {
        console.error('Error generating ID card:', error);
        return false;
    }
};