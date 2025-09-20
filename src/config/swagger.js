import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cloud Post-IT API",
      version: "1.0.0",
      description: "API Documentation for Cloud Post-IT Web Gallery",
    },
    servers: [
      {
        url: "http://localhost:5000", // แก้ให้ตรงกับ PORT ของคุณ
      },
    ],
  },
  apis: ["./src/routes/*.js"], // สแกนไฟล์ routes เพื่อดึง JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;