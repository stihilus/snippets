# P5.js Snippets Platform

A platform for sharing and managing P5.js code snippets. This application allows users to create, share, and explore creative coding snippets made with P5.js.

## Features

- Create and share P5.js snippets
- Browse and explore other users' snippets
- User authentication system
- Interactive code preview
- Secure API endpoints

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- MongoDB (for database)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd p5js-snippets
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
```

## Running the Application

To start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured port).

## Project Structure

```
├── public/          # Static files (HTML, CSS, client-side JS)
├── server.js        # Main server file
├── package.json     # Project dependencies and scripts
└── .env            # Environment variables (create this)
```

## Dependencies

- express: Web application framework
- mongoose: MongoDB object modeling
- bcrypt: Password hashing
- jsonwebtoken: JWT authentication
- dotenv: Environment variables management
- multer: File upload handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [P5.js](https://p5js.org/) for the amazing creative coding library
- All contributors and users of this platform
