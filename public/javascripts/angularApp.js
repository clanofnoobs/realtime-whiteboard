var app = angular.module('whiteboard', ['ui.router']);

app.controller('signup', ['$scope', '$http','$timeout', function($scope, $http, $timeout){

  $scope.$watch('username', function(){
    if ($scope.username.length >= 3){
     $scope.getUsername($scope.username); 
    } else {
      $scope.userFree = false; 
      $scope.userNotFree = false;
    }
  });

  $scope.$watch('email', function(){
    if ($scope.email.match(/\w+@\w+.(com|gov|org|net|\w+.edu)/)){
      $scope.getUsername($scope.email);
    } else {
      $scope.eTaken = false;
      $scope.eNotTaken = false;
    }
  });


  $scope.getUsername = function(cred){
    if (cred == $scope.email){
      $scope.loadingEmail = true;
    } else {
      $scope.loadingUser = true;
    }
    return $http.get('/checkusername?username='+cred)
      .success(function(data){
      $timeout(function(){
        if (cred == $scope.email){
          $scope.loadingEmail= false;
          $scope.eNotTaken = true;
          $scope.eTaken = false;
        } else {
          $scope.loadingUser = false;
          $scope.userFree = true;
          $scope.userNotFree = false;
        }
      },200);
      }).error(function(data){
        $timeout(function(){
          if (cred == $scope.email){
            $scope.loadingEmail = false;
            $scope.eNotTaken = false;
            $scope.eTaken = true;
          } else {
            $scope.loadingUser = false;
            $scope.userFree = false;
            $scope.userNotFree = true;
          }
        }, 200);
      });
  }

}]);

app.factory("user", ["$http","$location","$q","$timeout","notification", function($http, $location, $q,$timeout, notification){
  var o = {
    user: {},
    requestedBoardToken: ""
  }

  o.login = function(credentials){
    return $http.post('/login',credentials)
      .success(function(data){
        angular.copy(data,o.user);
        $location.url('/user/'+data.local.username);
      })
    .error(function(err, status, headers, config){
        if (status == 403){
          notification.changeToDanger();
        } else if (status == 401) {
          notification.changeToWarning();
        }
        notification.setNotificationMessage(err);
        notification.showNotification();
      });
  }

  o.logOut = function(){
    return $http.get('/logout')
      .success(function(){
        $location.url('/login');
      })
      .error(function(err){
        console.log(err);
      });
  }

  o.checkIfLoggedIn = function(){
    var deferred = $q.defer();
    $http.get('/checkIfLoggedIn')
      .success(function(data){
        deferred.resolve(data);
      }).error(function(data){
        deferred.reject(data);
      });
    return deferred.promise;
  }

  o.requestAuthor = function(object){
    return $http({
      method: 'GET',
      url: '/request/'+object,
      data: "",
      headers: { 'Content-Type': 'application/json'}
    })
      .success(function(data){
        $("#exampleModal").modal('hide');
         notification.setNotificationMessage(data); 
         notification.changeToSuccess();
         notification.showNotification();
      }).error(function(data){
      $("#exampleModal").modal('hide');
       notification.setNotificationMessage(data); 
       notification.changeToDanger();
       notification.showNotification();
      });
  }

  o.grantAccess = function(req){
    var deferred = $q.defer();
    $http.get('/permissions/'+req.token+'/?permission='+req.type)
      .success(function(data){
        notification.setNotificationMessage(data);
        notification.changeToSuccess();
        notification.showNotification();
        deferred.resolve(data);
      }).error(function(err){
        notification.setNotificationMessage(err);
        notification.changeToDanger();
        notification.showNotification();
        deferred.reject(data);
      });
    return deferred.promise;
  }

  return o;
}]);

app.factory("whiteboards", ['$http','$q','$location','$filter', function($http, $q, $location, $filter){
  var o = {
    whiteboards : {},
    canvas: {},
    board: {},
    user: ""
  };

  
  o.create = function(whiteboard){
    return $http.post('/createboard', whiteboard)
      .success(function(data){
       $location.url("/user/"+data.author.local.username+"/board/"+data.slug+"?unique_token="+data.unique_token);
      }).error(function(data){
       console.log(data);
      });
  }

  o.deleteBoard = function(unique_token){
    var deferred = $q.defer();
    return $http.delete('/board/delete/'+unique_token)
      .success(function(data){
        deferred.resolve(data);
        o.whiteboards.whiteboards = o.whiteboards.whiteboards.filter(function(sBoard){
          return (sBoard.unique_token != unique_token);
        });
        return deferred.promise;
      }).error(function(data, status, headers, config){
        if (status == 403){
          deferred.reject(data);
          alert("you are not logged in");
          $location.url("/login");
        } else if (status == 401){
          deferred.reject(data);
          alert("You are not authorized");
          $location('/login');
        }
        return deferred.promise;
      });
  }

  o.getUsersWhiteboards = function(username){
    var deferred = $q.defer();
    return $http.get('/user/'+ username)
      .success(function(data){
        deferred.resolve(data);
        angular.copy(data, o.whiteboards);
      }).error(function(data, status, headers, config){
        if (status == 404){
          $location.url("/404");
          deferred.reject(data);
        }
      });
    return deferred.promise;
  }
  o.getBoard = function(params){
    var deferred = $q.defer();
    $http.get('/user/'+params.username+'/board/'+params.slug+'?unique_token='+params.unique_token)
      .success(function(data){
        deferred.resolve(data);
        angular.copy(data.whiteboard, o.board);
        o.user = data.user;
      })
      .error(function(data, status, headers, config){
        if (status == 401);{
          deferred.reject(data);
        }
      });
      return deferred.promise;
  }

  o.checkIfLoggedInAndAuth = function(whiteboard){
  }
  return o;
}]);

app.controller('login', ['$scope', 'user', '$http','$timeout','dropdown', 'events',function($scope, user, $http, $timeout,dropdown, events){

  $scope.noti = "notification.html";

  $scope.$on('$viewContentLoaded', function(e){
    $timeout(function(){
      $("#notification div").fadeOut(500);
    },3000);
  });
  $scope.user = user.user;
  $scope.navbar = "navbar.html";

  if (user.user && user.user.local){
    $scope.user["theUser"] = user.user.local.username;
  }

  $scope.$on('show',function(event){
    dropdown.showDropDown();
  });
  $scope.$on('hide',function(event){
    dropdown.hideDropDown();
  });
  $scope.$on('login',function(event){
    dropdown.showLogin();
  });


  $scope.login = function(usr, pass){
    user.login({
      username: usr,
      password: pass
    });
  }
  
  $scope.logOut = function(){
    user.logOut();
  }
}]);

app.controller('create_whiteboard', ['whiteboards','$scope', '$http', function(whiteboards,$scope, $http){

  $scope.createWhiteboard = function(){
    whiteboards.create({
      title: $scope.title
    });
  }
}]);

app.controller('home', ['$scope','whiteboards','$timeout','user','$location','dropdown','events', function($scope, whiteboards, $timeout, user,$location,dropdown,events){
  $scope.emails = [];

  $scope.$on('show',function(event){
    dropdown.showDropDown();
  });
  $scope.$on('hide',function(event){
    dropdown.hideDropDown();
  });
  $scope.$on('login',function(event){
    dropdown.showLogin();
  });

  $scope.user = whiteboards.whiteboards;
  $scope.user["theUser"] = whiteboards.whiteboards.theUser;
  $scope.whiteboards = whiteboards.whiteboards.whiteboards;
  $scope.template = "boards.html";
  $scope.navbar = "navbar.html";


  $scope.logOut = function(){
    user.logOut();
  }

  $scope.$watch('whiteboards', function(){
    if ($scope.whiteboards == ''){
      $scope.empty = true;
    }
  });

  var lastChar = "";
  $scope.$watch('email',function(e){
    lastChar = $scope.email[$scope.email.length-1];
    if (lastChar == " " || lastChar == ","){
      $scope.email = $scope.email.replace(",","");
      $scope.emails.push($scope.email);
      $scope.email = "";
    }
  });

  $("#board textarea").bind("keyup", function(e){
    if (e.keyCode == 8 && $scope.email == ""){
      $scope.emails.splice($scope.emails.length-1,1);
    }
    $scope.$apply();
  });

  $scope.delete = function(email){
    $scope.emails.splice($scope.emails.indexOf(email),1);
  }

  $scope.cloneBoard = function(boardObj){

    $("#exampleModal").modal('show');

    user.requestedBoard = boardObj.unique_token
  }

  $scope.showBoardForm = function(){
    $("#board").modal('show');
    $("#board .modal-body input").val("Untitled");
    $("#board .modal-body input").select();
    $scope.emails = [];
    $scope.email = "";
  };

  $scope.createBoard = function(){
    $("#board").modal("hide");

    whiteboards.create({
      title: $scope.title ? $scope.title : "Untitled",
      emails: $scope.emails
    });
  }

  $scope.requestAuthor = function(){
    user.requestAuthor(user.requestedBoard); 
  }

  $scope.showRequests = function(){
    $scope.template = "requests.html";
  }

  $scope.showBoards = function(){
    $scope.template = "boards.html";
  }

  $scope.board = function(board){
    $location.url("/user/"+$scope.user.local.username+"/board/"+board.slug+"?unique_token="+board.unique_token);
  }

  $scope.grantAccess = function(request,event){
    if (event.target.getAttribute("id") == "complete"){
      request["type"] = "access";
    }     
    user.grantAccess(request).then(function(data){
      $scope.user.requests = $scope.user.requests.filter(function(sRequest){
        return sRequest.token != request.token;
      });
    });
  }

  $scope.deleteBoard = function(unique_token){
    whiteboards.deleteBoard(unique_token).then(function(data){
      $scope.whiteboards = whiteboards.whiteboards.whiteboards;
    });
  }

}]);

app.controller('board', ['$scope', 'whiteboards','$timeout','notification','$window', function($scope, whiteboards, $timeout, notification, $window){
  $scope.users = [];
  var count = 0;
  var hash = {};
  var socket = io.connect('/room');


  var cUsers = [];
  if (whiteboards.board.controlled_access){
    whiteboards.board.controlled_access.map(function(controlledUsers){
      cUsers.push(controlledUsers.local.username);
    });
  }

  if (cUsers.indexOf(whiteboards.user) != -1){
    var canvas = new fabric.StaticCanvas('c');
    $scope.isControlled = true;
  } else {
    var canvas = new fabric.CanvasWithViewport('c');
  }
  canvas.isGrabMode = true;

  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);
  canvas.calcOffset();
  $scope.board = whiteboards.board;
  //canvas.setZoom(1.5);
  //canvas.setPosition({ x:279, y: 128});
  //201 - top :: 334:: left

  var obj = {};
  obj["unique_token"] = whiteboards.board.unique_token;
  obj["user"] = whiteboards.user;
  userConnected(obj["user"]);
  var userColor = $("#"+obj["user"]).css("background-color");
  obj["color"] = userColor;
  socket.emit("user", obj);

  whiteboards.canvas = canvas.toObject();
  whiteboards.canvas.objects = [];
  if ($scope.board.objects){
    $scope.board.objects.forEach(function(canvasObj){
      whiteboards.canvas.objects.push(canvasObj);
    });
  }
  canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));
  canvas.renderAll();
  canvas.getObjects().forEach(function(obj){
    hash[obj.unique_token] = obj;
    if (count < 2){
      console.log(hash[obj.unique_token]);
    }
    count++;
  });
    
  var brush = new fabric.PencilBrush(canvas);
  //var brush1 = new fabric.PencilBrush(canvas);
  var ownerBrush = new fabric.PencilBrush(canvas);
  var testObj = {};
  //clients brushes
  /*
  testObj['cla'] = brush1;
  brush1.color = 'green';
  */

  //owner brush; gets used in draw emission event
  ownerBrush.color = $scope.color || 'black';
  ownerBrush.width = 1;
  $scope.$watch('drawingStrokeWidth', function(){
    ownerBrush.width = $scope.drawingStrokeWidth;
  });
  
  $scope.$watch('color', function(){
    ownerBrush.color = $scope.color;
  });

  function getRandomColor(){
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ){
      color += letters[Math.floor(Math.random()* 16)];
    }
    return color;
  };

  $scope.centerObj = function(){
    canvas.setZoom(1);
    var xDiff = canvas.getCenter().left - $scope.selectedObj.left;
    var yDiff = canvas.getCenter().top - $scope.selectedObj.top;
    canvas.setPosition({ x:xDiff,  y: yDiff });
  }
  $scope.test123 = canvas.getObjects();

  $scope.centerFOV = function(){
    canvas.setZoom(1);
    var rightMost = canvas.getObjects()[0].left;
    var leftMost = rightMost;
    var bottomMost = canvas.getObjects()[0].top;
    var topMost = bottomMost;
    
    $scope.test123.forEach(function(obj){
      obj.setCoords();
      if (obj.left > rightMost){
        rightMost = obj.left;
      }
      if (obj.left < leftMost){
        leftMost = obj.left;
      }
      if (obj.top > bottomMost){
        bottomMost = obj.top;
      }
      if (obj.top < topMost){
        topMost = obj.top;
      }
    });
    var xDiffCenter = canvas.getCenter().left - (((rightMost - leftMost)/2) + leftMost);
    var yDiffCenter = canvas.getCenter().top - (((bottomMost - topMost)/2) + topMost);

    canvas.setPosition({x: xDiffCenter, y: yDiffCenter});
    canvas.setZoom(1/1.1);
  }

  $scope.changeMode = function(action){
    switch(action){
      case 'pan':
        canvas.isDrawingMode = false;
        canvas.isGrabMode = true;
        break;
      case 'move':
        canvas.isDrawingMode = false;
        canvas.isGrabMode = false;
        break;
      case 'draw':
        canvas.isGrabMode = false;
        canvas.isDrawingMode = true;
        break;
      default:
        canvas.isDrawingMode = false;
        canvas.isGrabMode = true;
    }
  };

  function userConnected(theUser, color){
    var user = $("<div></div>").text(theUser);
    if (color){
      user.attr("style","background-color:"+color);
    } else {
      user.attr("style","background-color:"+getRandomColor());
    }
    user.attr("id",theUser);
    $("#topPage #container").append(user);
  }

  canvas.renderAll();
  var path;

  //socket events

  socket.on("clear", function(){
    canvas.clear();
    canvas.renderAll();
    whiteboards.canvas.objects = [];
  });

  socket.on("userEnter", function(user){
    if (!document.getElementById(user.user)){
      userConnected(user.user, user.color);
    }
    var obj = { user: whiteboards.user, color: userColor};
    socket.emit("enter", obj); 
  });

  socket.on("userAlreadyConnected", function(user){
    if (!document.getElementById(user.user)){
      userConnected(user.user, user.color);
    }
  });
  
  socket.on("objectMove", function(coords){
    hash[coords.unique_token].left = coords.x;
    hash[coords.unique_token].top = coords.y;
    hash[coords.unique_token].setCoords();
    canvas.renderAll();
  });

  socket.on("objectAdded", function(object){

    whiteboards.canvas.objects.push(object);
    canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));

    canvas.renderAll();

    canvas.getObjects().forEach(function(obj){
      hash[obj.unique_token] = obj;
    });
  });

  socket.on("objectModded", function(object){
    canvas.fire("object:modified", object);
    $scope.clientChange = true;
  });

  socket.on("scale", function(scale){
    //TODO - bugfix: scaling left, not showing up on client
    hash[scale.unique_token].scaleX = scale.x;
    hash[scale.unique_token].scaleY = scale.y;
    hash[scale.unique_token].setCoords();
    canvas.renderAll();
  });

  socket.on("rotating", function(angle){
    hash[angle.unique_token].angle = angle.angle;
    hash[angle.unique_token].setCoords();
    canvas.renderAll();
  });

  socket.on("mouseup", function(user){
    if (testObj[user]){
      testObj[user]._points = [];
    }
  });

  socket.on("draw", function(thePath){

    var canvasObj = canvas.toObject();

    whiteboards.canvas.objects.push(thePath);
    canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));
    canvas.renderAll();

    canvas.getObjects().forEach(function(obj){
      hash[obj.unique_token] = obj;
    });
  });

  socket.on("userLeft", function(user){
    $("#"+user).fadeOut(300,function(){
      $(this).remove();
    });
  });

  /*socket.on("drawing",function(points){
    if (testObj[points.user]){
    testObj[points.user].onMouseMove(points);
    }
    //brush.onMouseMove(points);
  });*/

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }
  // canvas events

  canvas.on("mouse:move", function(e){
    if (canvas.isDrawingMode && isDrawing){
      var points = { x: e.e.offsetX, y: e.e.offsetY, user: whiteboards.user };
      //socket.emit("drawing", points);
    }
  });
  
  canvas.on('object:modified', function(object){
    var activeObject = object.target;
    activeObject.toObject = (function(toObject){
      return function(){
        return fabric.util.object.extend(toObject.call(this),{
          unique_token: this.unique_token
        });
      };
    })(activeObject.toObject);

    for (i=0;i < whiteboards.canvas.objects.length; i++){
      if (whiteboards.canvas.objects[i].unique_token == activeObject.unique_token){
        whiteboards.canvas.objects[i] = activeObject;
      }
    } 

    var obj = { object: activeObject, unique_token: activeObject.unique_token, clientObject: object }

    if (!$scope.clientChange){
      socket.emit("objectModded", obj);
    } else {
      $scope.clientChange = false;
    }
  });

  canvas.on('object:added', function(obj){
    var target = obj.target;
    if ($scope.shapeAdded == true && obj.target.type != 'path'){

      socket.emit("objectAdded", target.toObject());
      $scope.shapeAdded = false;
    }
  });

  canvas.on('object:scaling', function(e){
    var scale = { x: e.target.scaleX, y: e.target.scaleY, unique_token: e.target.unique_token  }

    socket.emit("scale", scale);
  });

  canvas.on('object:rotating', function(e){
    var obj = { angle: e.target.angle, unique_token: e.target.unique_token }
    socket.emit("rotating", obj);
  });

  canvas.on('object:selected', function(e){
    $scope.selectedObj = e.target;
    console.log(e.target);
  });

  canvas.on('object:moving', debounce(function(e){
    var activeObject = e.target;

    console.log(e.target);
    var coords = { x: activeObject.get('left'), y: activeObject.get('top'), unique_token: activeObject.unique_token }
    socket.emit("objectMove", coords);
  },12));

  canvas.on("mouse:up",function(){
    isDrawing = false;
    socket.emit("mouseup", whiteboards.user);
  });

  canvas.on("path:created", function(e){
    path  = e.path;
    path.toObject = (function(toObject){
      return function(){
        return fabric.util.object.extend(toObject.call(this),{
          unique_token: this.unique_token,
          color: this.color
        });
      };
    })(path.toObject)

    path.unique_token = makeid();
    path.stroke = $scope.color || 'black';
    path.strokeWidth = $scope.drawingStrokeWidth || 1;
    var json = path.toJSON();

    //adds path to current array of objects so that any incoming changes doesn't override the user/clients prior changes
    whiteboards.canvas.objects.push(path);
    canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));

    //add to hash to that other users can controll newly created path/object
    canvas.getObjects().forEach(function(obj){
      hash[obj.unique_token] = obj;
    });

    canvas.renderAll();

    socket.emit("draw", json);
  });
  var isDrawing;

  //canvas.on("mouse:down"...
  $("#c").on("click", function(){
    if ($scope.isControlled == true){
      notification.showNotification();
    }

    if (canvas.isDrawingMode){
      isDrawing = true;
    }
  });

  $scope.getPhoto = function(){
    $window.open(canvas.toDataURL('png'));
  }

  $scope.canvasActions = function(shape, callback){
    if ($scope.isControlled == true){
      notification.showNotification();
      return;
    }

    if (shape){
      callback(shape);
    } else {
      callback();
    }

  };

  $scope.clearCanvas = function(){
    canvas.clear();
    canvas.renderAll();
    whiteboards.canvas.objects = [];
    socket.emit("clear");
  };

  //add circles and squares
  $scope.addShape = function(shape){
    var obj;
    switch(shape){
      case 'triangle':
        obj = new fabric.Triangle();
        break;
      case 'circle':
        obj = new fabric.Circle();
        break;
      case 'rect':
        obj = new fabric.Rect();
        break;
      default:
        obj - new fabric.Rect();
    }
    obj.toObject = (function(toObject){
      return function(){
        return fabric.util.object.extend(toObject.call(this),{
          unique_token: this.unique_token
        });
      };
    })(obj.toObject)
    if (shape == 'circle'){
      obj.radius = 30;
    }
    obj.unique_token = makeid();
    obj.top = canvas.getCenter().top;
    obj.left = canvas.getCenter().left;
    obj.width = 30;
    obj.height = 30;
    obj.stroke = $scope.strokeColor || 'black';
    obj.strokeWidth = $scope.strokeWidth || 2;
    obj.fill = $scope.fillColor || 'black';
    obj.setCoords();
    $scope.shapeAdded = true;
    whiteboards.canvas.objects.push(obj);
    canvas.add(obj);
    canvas.renderAll();
  }

  function createBrush(user){
    var brush = new fabric.PencilBrush(canvas);
    testObj[user] = brush;
  }

  function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 7; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

}]);

app.filter('first', function(){
  return function(input){
    var firstLetter = input.charAt(0);
    return firstLetter;
  };
});

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){
      $stateProvider
        .state('root',{
          url:'',
          controller: 'login',
          templateUrl: 'test1.html',
          resolve: {
            checkIfLoggedInAndAuth: ['user',function(user){
              user.checkIfLoggedIn().then(function(data){
                user.user = data;
              }).catch(function(){
                return;
              });
            }]
          }
        })
        .state('login',{
          url:'/login',
          controller: 'login',
          templateUrl: 'login.ejs',
          resolve: {
            getPromise: ['user','$location', function(user,$location){
              user.checkIfLoggedIn().then(function(data){
                return $location.url("/user/"+data.local.username);
              }).catch(function(){
                return;
              });
            }]
          }
        })
        .state('create', {
          url: '/createboard',
          controller: 'create_whiteboard',
          templateUrl: 'create.html',
          resolve: {
            checkIfLoggedInAndAuth: ['user',function(user){
              user.checkIfLoggedIn().then(function(data){
                user.user = req.user;
              });
            }]
          }
        })
        .state('404', {
          url: '/404',
          controller: 'signup',
          templateUrl: '404.html'
        })
        .state('signup', {
          url:'/signup',
          controller: 'signup',
          templateUrl: 'signup.html'
        })
        .state('board', {
          url:'/user/{username}/board/{slug}?unique_token',
          controller: 'board',
          templateUrl: 'whiteboard.html',
          resolve: {
            getBoard: ['whiteboards', '$stateParams','notification','$location','$timeout', function(whiteboards, $stateParams,notification,$location,$timeout){
              return whiteboards.getBoard($stateParams).then(function(data){
                return;
              }).catch(function(data){
                $location.url("/login");
                $timeout(function(){
                  notification.setNotificationMessage("Not authorized");
                  notification.changeToWarning();
                  notification.showNotification();
                },200)
              });
            }]
          }
        })
        .state('user_homepage', {
          url: '/user/{username}',
          controller: 'home',
          templateUrl: 'user.html',
          resolve: {
            getPromise : ['whiteboards', '$stateParams', function(whiteboards, $stateParams){
              return whiteboards.getUsersWhiteboards($stateParams.username);
            }]
          },
          checkIfLoggedInAndAuth: ['user',function(user){
            user.checkIfLoggedIn().then(function(data){
              user.user = req.user;
            });
          }]
        });
    $urlRouterProvider.otherwise('');
    }
]);

app.service("dropdown", function(){
  this.showDropDown = function(){
    angular.element(document.querySelector("#test123")).css("display","block");
    angular.element(document.querySelector("#user")).css("background","rgba(240,240,240,0.95)");
    angular.element(document.querySelector(".caret")).css("color","white");
  } 
  this.hideDropDown = function(){
    angular.element(document.querySelector("#test123")).css("display","none");
    angular.element(document.querySelector("#user")).css("background","rgb(248,248,248)");
    angular.element(document.querySelector(".caret")).css("color","black");
  }
  this.showLogin = function(){
    angular.element(document.querySelector("#loginModal")).css("display","block");
    $("#loginModal").fadeIn(185);
  }
});

app.service("events", function(){
  var isShown;
  this.titleAnim = (function(){
    $(window).scroll(function(){
    if ($(window).scrollTop() >= 50 && !isShown){
      isShown = true;
      $('.title div').css("top","-20%");
      $('.title').css("height","105%");
      $('.title').css("border-bottom-right-radius","0px");
    } else if ($(window).scrollTop() <= 50 && isShown){
      isShown = false;
      $('.title div').css("top","50%");
      $('.title').css("height","200%");
      $('.title').css("border-bottom-right-radius","30px");
    }
    });
  })();

  this.hideDropDown = (function(){
    $(document.body).click(function(e){
      if ($(e.target).hasClass("caret") || $(e.target).hasClass("logout") || $(e.target).parents('.login').length || $(e.target).hasClass("glyphicon-log-in")){
      return;
      }
      $("#test123").hide();
      $("#loginModal").fadeOut(185);
      $("#user").css("background","rgb(248,248,248)");
    });
  })();
});

app.service("notification", function($timeout){
  this.setNotificationMessage = function(message){
    $("#tes1 div p").text("");
    $("#tes1 div p").append(message);
  }
  this.showNotification = function(){
    $("#tes1").fadeIn(500);
    $timeout(function(){
      $("#tes1").fadeOut(500);
    },3000);
  }
  this.changeToWarning = function(){
    $("#tes1 div").removeClass("alert-success");
    $("#tes1 div").removeClass("alert-danger");
    $("#tes1 div").addClass("alert-warning");
  }
  this.changeToDanger = function(){
    $("#tes1 div").removeClass("alert-success");
    $("#tes1 div").removeClass("alert-warning");
    $("#tes1 div").addClass("alert-danger");
  }
  this.changeToSuccess = function(){
    $("#tes1 div").removeClass("alert-danger");
    $("#tes1 div").removeClass("alert-warning");
    $("#tes1 div").addClass("alert-success");
  }
});

