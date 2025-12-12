import express, { request, Router } from 'express';
import cors from 'cors';
import cookiesParser from 'cookie-parser';
import errorMiddleware from './middleware/error.middleware.js';
import path from 'path';
// import { generateIdCard } from './utils/generateIdCard.js';



// // Example usage
// generateIdCard(
//     'Tarik Aziz',
//     'INL373334',
//     '01/01/1980',
//     'Regular',
//     '01/01/2025',
//     'A:/Development/ISFMP/Server/images/TARIK.jpg',
// );




const app = express();


// CORS configuration
app.use(cors({
    origin: ['https://isfmp.tagobuy.site', 'http://localhost:8080', 'http://localhost:5173', 'https://portal.isfwb.org', 'https://isfwb.org', 'http://127.0.0.1:5501'], // Adjust origins as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));




// Middleware configuration
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use('/images', express.static(path.join(process.cwd(), 'images')));
app.use(cookiesParser());





app.get('/', (req, res) => {
    res.send('Welcome ISF Membership Portal')
})


//import routes
import userRouter from './routes/user.routes.js';
import donationRouter from './routes/donation.routes.js';
import phonepeRoutes from './routes/phonepe.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import memberRoutes from './routes/member.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import noticeRoutes from './routes/notice.routes.js';
import countryRoutes from './routes/country.routes.js';
import stateRoutes from './routes/state.routes.js';
import districtRoutes from './routes/district.routes.js';
import parliamentConstituencyRoutes from './routes/parliamentConstituency.routes.js';
import authRoutes from './routes/auth.routes.js';
import statisticsRoutes from './routes/statistics.routes.js';
import otpRoutes from './routes/otp.routes.js';


//route diclaration
app.use("/user", userRouter);
app.use(donationRouter);
app.use(phonepeRoutes);
app.use(membershipRoutes);
app.use("/member", memberRoutes);
app.use('/otp', otpRoutes);
app.use(transactionRoutes);
app.use(noticeRoutes);
app.use(countryRoutes);
app.use(stateRoutes);
app.use(districtRoutes);
app.use(parliamentConstituencyRoutes);
app.use(authRoutes)
app.use('/statistics', statisticsRoutes);



// 404 fallback in JSON
app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});

// Error handling middleware (must be after routes)
app.use(errorMiddleware);

export {app}
