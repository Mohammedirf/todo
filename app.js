//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.set('view-engine', 'ejs');

mongoose.connect("mongodb+srv://admin-irfi:Test123@cluster0-ejtso.mongodb.net/ProjectDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

//Get Today date
const today = new Date();
const options = {
  weekday: 'long',
  month: 'short',
  day: 'numeric'
};
const day = today.toLocaleDateString("en-us", options);

// defining the schema
const taskSchema = new mongoose.Schema({
  name: String,
  completed: Boolean
});

const projectSchema = new mongoose.Schema({
  name: String,
  tasks: [taskSchema]
});

// defining the models
const Task = mongoose.model("Task", taskSchema);
const Project = mongoose.model("Project", projectSchema);

//Creating Seed data
const tsk1 = new Task({
  name: "Sample Task 1",
  completed: false
});
const tsk2 = new Task({
  name: "Sample Task 2",
  completed: false
});
const tsk3 = new Task({
  name: "Sample Task 3",
  completed: false
});

var seedTasks = [tsk1, tsk2, tsk3];

// Inserting Dummy records if databse is empty
function insertSeedData() {
  console.log("Inside Seed Data");
  Task.insertMany(seedTasks, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Seed Data Successful");
    }
  });
}


// Sending initial response to user
app.get("/", function(req, res) {
  Project.find({},function(err,projectList){
    if(!err){
      //console.log(projectList);
      res.render("projects.ejs",{projects:projectList});
    }
  });

});

app.post("/addproject",function(req,res){
  console.log(req.body.projectName);

  //code to handle adding project

  const projectName = req.body.projectName;
    Project.findOne({
      name: projectName
    }, function(err, project) {
      if (!err) {
        //console.log(project);
        if (project == null) {
          const newProject = new Project({
            name: projectName
          });
          newProject.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("New Project created successfully");
            }
          });
          res.redirect("/");
        } else {
          res.redirect("/");
        }
      }
    });
});

app.post("/addtask",function(req,res){
  const newTaskName = req.body.newTaskName;
  const newTaskParentId =req.body.newTaskParentId;
  const newTask = new Task({
    name: newTaskName,
    completed: false
  });
  Project.findOne({
      _id: newTaskParentId
    },
    function(err, project) {
      if (err) {
        console.log(err);
      } else {
        project.tasks.push(newTask);
        project.save(function(err){
          if(err){
            console.log(err);
          }
          else{
            res.redirect("/");
          }
        });
      }
    }
  );
  //res.redirect("/");
  //  code to handle adding tasks under a project
});

app.post("/completetask",function(req,res){
  const delTaskId = req.body.delTaskId;
  const delTaskParentId =req.body.delTaskParentId;
  Project.findOneAndUpdate({
    _id: delTaskParentId
  }, {
    $pull: {
      tasks: {
        _id: delTaskId
      }
    }
  }, function(err) {
    if(err){
      console.log(err);
    }
    else{
      console.log("Task completed successfully");
    }
  });
  res.redirect("/");
  //  code to handle adding tasks under a project
});

app.post("/delproject",function(req,res){
  const projectId=req.body.delProjectId;
  console.log(projectId);
  Project.deleteOne({_id:projectId},function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Project Deleted Successfully");
    }
  });
  res.redirect("/");
  //console.log(req.body.projectName);
});

// Delete tasks need to be altered
app.post("/delete/:head", function(req, res) {
  // console.log("Inside Delete");
  const projName = req.params.head;
  const deletedId = req.body.deleteItems;

  // Use slicing and udpate for deleting the object
  // Project.findOne({
  //     name: projName
  //   },
  //   function(err, project) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       //console.log(project.tasks);
  //       var index = project.tasks.findIndex((task) => task._id == deletedId);
  //       //console.log(index);
  //       project.tasks.splice(index, 1);
  //       //console.log(project.tasks);
  //       Project.updateOne({name:projName},{tasks:project.tasks},function(err, rawResponse){
  //         console.log(err);
  //       });
  //     }
  //   }
  // );
  Project.findOneAndUpdate({
    name: projName
  }, {
    $pull: {
      tasks: {
        _id: deletedId
      }
    }
  }, function(err) {
    if(err){
      console.log(err);
    }
  });
  res.redirect("/"+projName);
});

// Save new items
app.post("/save/:head", function(req, res) {
  const projName = req.params.head;
  const itemName = req.body.newItem;
  saveTask(itemName, projName);
  //console.log(toDoItems);
  res.redirect("/" + projName);
});

//Display tasks for specific projects
// app.get("/:head", function(req, res) {
//   const projectName = req.params.head;
//   const listFind = Project.findOne({
//     name: projectName
//   }, function(err, project) {
//     if (!err) {
//       //console.log(project);
//       if (project == null) {
//         const newProject = new Project({
//           name: projectName,
//           tasks: seedTasks
//         });
//         newProject.save(function(err) {
//           if (err) {
//             console.log(err);
//           } else {
//             console.log("New Project created successfully");
//           }
//         });
//         res.redirect("/" + projectName);
//       } else {
//         res.render("list.ejs", {
//           kindOfDay: projectName,
//           toDoList: project.tasks,
//           masterListName: projectName
//         });
//       }
//     }
//   });
// });

//Saving newTask to database
function saveTask(taskName, projectName) {
  const newTask = new Task({
    name: taskName,
    completed: false
  });
  Project.findOne({
      _id: projectName
    },
    function(err, project) {
      if (err) {
        console.log(err);
      } else {
        project.tasks.push(newTask);
        project.save();
      }
    }
  );
}

// Starting the server
app.listen(process.env.PORT || 3000, function() {
  var sToday = new Date();
  const sOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  };
  console.log("Initializing server at port 3000 on " + sToday.toLocaleDateString("en-us", sOptions));
});

// 5ec96e43c3bf6674c5f17b21
// 5ec96e43c3bf6674c5f17b21
