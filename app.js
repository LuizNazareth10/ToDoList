import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import path from 'path';
import fs  from 'fs';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_PATH = path.join(__dirname, 'data', 'tasks.json');
const app = express();
const port = 3000

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

function loadTasks(){
    try {
        const data = fs.readFileSync(TASKS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveTask(tasks){
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

app.get('/', (req, res) => {
    const {category, period, priority} = req.query;
    let tasks = loadTasks();

    if (category == "completed"){
        tasks = tasks.filter(task => task.completed);
    }
    else if(category == "incomplete"){
        tasks = tasks.filter(task => !task.completed);
    }
    else {
        tasks = tasks
    }

    if (priority == "high"){
        tasks = tasks.filter(task => task.priority === "high");
    }
    else if(priority == "medium"){
        tasks = tasks.filter(task => task.priority === "medium");
    }
    else if(priority == "low"){
        tasks = tasks.filter(task => task.priority === "low");
    }
    else {
        tasks = tasks
    }

    if (period == "today"){
        tasks = tasks.filter(task => task.dueDate === new Date().toISOString().split('T')[0]);
    }
    else if(period == "this week"){
        const daysToEndOfTheWeek = 6 - new Date().getDay();
        const possibleDays = []
        for (let i = 0; i < daysToEndOfTheWeek; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            possibleDays.push(date.toISOString().split('T')[0]);
        }
        tasks = tasks.filter(task => possibleDays.includes(task.dueDate));
    }
    else if(period == "this month"){
        const daysToEndOfTheMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const possibleDays = []
        for (let i = 0; i < daysToEndOfTheMonth; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            possibleDays.push(date.toISOString().split('T')[0]);
        }
        tasks = tasks.filter(task => possibleDays.includes(task.dueDate));
    }
    else if(period == "this year"){
        const daysToEndOfTheYear = new Date(new Date().getFullYear() + 1, 0, 0).getDate();
        const possibleDays = []
        for (let i = 0; i < daysToEndOfTheYear; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            possibleDays.push(date.toISOString().split('T')[0]);
        }
        tasks = tasks.filter(task => possibleDays.includes(task.dueDate));
    }
    else {
        tasks = tasks
    }

    res.render('index', { tasks });
});

app.post('/add', (req, res) => {
    const {title, description, dueDate, completed, createdAt, priority, attachment } = req.body;
    const tasks = loadTasks();
    const taskId = Math.random().toString(36).substring(2, 10);
  
    const newTask = {
      taskId,
      title,
      description,
      dueDate,
      completed,
      createdAt,
      priority,
      attachment
    };
  
    tasks.push(newTask);
  
    saveTask(tasks);
  
    res.redirect('/');
  });

  app.post('/delete/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const tasks = loadTasks();
  
    const updatedTasks = tasks.filter(task => task.taskId !== taskId);
  
    saveTask(updatedTasks);
  
    res.redirect('/');
  });

  app.post('/complete/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const tasks = loadTasks();
  
    const updatedTasks = tasks.map(task => {
      if (task.taskId === taskId) {
        task.completed = !task.completed;
      }
      return task;
    });
  
    saveTask(updatedTasks);
  
    res.redirect('/');
  });

app.listen(port, () => {
    console.log('Server started on port 3000');
});