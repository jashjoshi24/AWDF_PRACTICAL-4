// Practical 4: Building a RESTful API with Node.js and Express
// Simple Task Management API using an in-memory array (no database).

const express = require('express');
const app = express();
const PORT = 5000;

// ---------- In-memory storage ----------
// Simple array of task objects. Resets whenever the server restarts.
let tasks = [
    { id: 1, title: 'Complete Practical 4', completed: false },
    { id: 2, title: 'Learn Express middleware', completed: true }
];
let nextId = 3; // used to assign an id to each new task

// ---------- Built-in middleware ----------
// Parses incoming JSON request bodies into req.body. Must come before routes.
app.use(express.json());

// ---------- Global request logging middleware ----------
// Runs for every incoming request and logs Method, URL, and Timestamp.
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next(); // pass control to the next middleware/route
});

// ---------- Middleware: require Content-Type: application/json on POST/PUT ----------
function requireJsonContentType(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!req.is('application/json')) {
            return res.status(400).json({ error: 'Content-Type must be application/json' });
        }
    }
    next();
}
app.use(requireJsonContentType);

// ---------- Route-specific middleware: validate that :id is a number ----------
function validateIdParam(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Task id must be a valid number' });
    }
    req.taskId = id; // store the parsed id for the route handler to use
    next();
}

// ---------- Routes ----------

// GET /tasks - return all tasks
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// POST /tasks - create a new task from the JSON request body
app.post('/tasks', (req, res) => {
    const { title, completed } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = {
        id: nextId++,
        title,
        completed: completed || false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT /tasks/:id - update an existing task by id
app.put('/tasks/:id', validateIdParam, (req, res) => {
    const task = tasks.find((t) => t.id === req.taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const { title, completed } = req.body;
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;

    res.status(200).json(task);
});

// DELETE /tasks/:id - delete an existing task by id
app.delete('/tasks/:id', validateIdParam, (req, res) => {
    const index = tasks.findIndex((t) => t.id === req.taskId);

    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(index, 1)[0];
    res.status(200).json({ message: 'Task deleted', task: deletedTask });
});

// ---------- 404 handler for undefined routes ----------
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ---------- Global error handling middleware (must be LAST) ----------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
