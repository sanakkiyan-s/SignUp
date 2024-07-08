const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;

const app = express();

mongoose.connect('mongodb://localhost:27017/registration', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering new user' });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registered Users</title>
                <style>
                    body { 
                        font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(45deg, #d2001a, #7462ff, #f48e21, #23d5ab, #007BFF); 
                        background-size: 300% 300%; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                    }

                    .container { 
                        background-color: #ffffffd4;
                        padding: 20px;
                        border-radius: 15px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        width: 500px; 
                    }

                    h1 { 
                        text-align: center; 
                        margin-bottom: 20px; 
                    }

                    ul { 
                        list-style-type: none; 
                        padding: 0; 
                    }

                    li { 
                        background-color: #f9f9f9; 
                        margin: 5px 0; 
                        padding: 10px; 
                        border: 1px solid #ddd; 
                        border-radius: 4px; 
                    }
                    
                    button {
                        background: none;
                        padding: 5px 12px;
                        border-radius: 25px;
                        cursor: pointer;
                    }

                    .delete {
                        background: #ff0000;
                        color: #fff;
                        border: 1px solid #ff0000;
                    }

                    .actions { 
                        margin-top: 10px; 
                        text-align: center; 
                    }

                    .actions button { 
                        margin: 0 5px; 
                    }

                    @keyframes color {
                        0% {
                            background-position: 0 50%;
                        }
                        50% {
                            background-position: 100% 50%;
                        }
                        100% {
                            background-position: 0 50%;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Registered Users</h1>
                    <ul>
                        ${users.map(user => `
                            <li>
                                ${user.name} (${user.email})
                                <div class="actions">
                                    <button onclick="editUser('${user._id}', '${user.name}', '${user.email}', '${user.password}')">Edit</button>
                                    <button onclick="deleteUser('${user._id}')" class="delete">Delete</button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <script>
                    async function deleteUser(id) {
                        const response = await fetch('/delete-user/' + id, { method: 'DELETE' });
                        const result = await response.json();
                        alert(result.message);
                        window.location.reload();
                    }

                    function editUser(id, name, email, password) {
                        const newName = prompt("Enter new name:", name);
                        const newEmail = prompt("Enter new email:", email);
                        const newPassword = prompt("Enter new passwor:", password);
                        if (newName && newEmail && newPassword) {
                            fetch('/edit-user/' + id, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ name: newName, email: newEmail, password: newPassword })
                            })
                            .then(response => response.json())
                            .then(result => {
                                alert(result.message);
                                window.location.reload();
                            });
                        }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Error retrieving users.');
    }
});

app.put('/edit-user/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    try {
        await User.findByIdAndUpdate(id, { name, email, password });
        res.json({ message: 'User updated successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

app.delete('/delete-user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port} or http://127.0.0.1:${port}`);
});
