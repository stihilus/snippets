# Snippets

## Introduction

This project is a web application built with Node.js, Express, MongoDB, and p5.js that allows users to share and view p5.js code snippets. Users can create accounts, login, post their p5.js code, and see the live previews of the sketches they create.

## Features

- **User Accounts:** Create an account to share your p5.js snippets and follow other users.
- **Snippet Sharing:** Post your p5.js code and see it rendered in a live preview.
- **Code Highlighting:** Code snippets are highlighted for better readability.
- **Live Preview:**  Instantly see the output of your p5.js code in a preview window.
- **User Profiles:** View the snippets posted by other users.

## Technologies Used

- **Node.js:** Backend framework
- **Express.js:** Web application framework
- **MongoDB:** Database for storing user data and snippets
- **p5.js:** JavaScript library for creating interactive graphics and animations
- **Tailwind CSS:** CSS framework for styling the user interface

## Getting Started

1. **Clone the Repository:**
```
git clone https://github.com/your-username/p5js-snippets.git
```

2. Install Dependencies:

```
cd p5js-snippets
npm install
```

3. Set Up Environment Variables:

- Create a . env file in the project root directory
- Add the following environment variables:
```
MONGODB_URI=your_mongodb_connection_string
```

4. Start the Server:
```
npm start
```

5. Access the Application:
Open your web browser and navigate to http://localhost:3000.
