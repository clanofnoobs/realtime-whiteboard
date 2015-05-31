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

app.factory("user", ["$http","$location","$q", function($http, $location, $q){
  var o = {
    user: {}
  }

  o.login = function(credentials){
    return $http.post('/login',credentials)
      .success(function(data){
        angular.copy(data,o.user);
        console.log(data);
        $location.url('/user/'+data.local.username);
      })
      .error(function(err){
        alert(err);
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
    return $http.get('/checkIfLoggedIn')
      .success(function(data){
        deferred.resolve(data);
      }).error(function(data){
        deferred.reject(data);
        $location.url("/login");
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
       console.log(data);   
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
    return $http.get('/user/'+params.username+'/board/'+params.slug+'?unique_token='+params.unique_token)
      .success(function(data){
        deferred.resolve(data);
        angular.copy(data.whiteboard, o.board);
        console.log(o.board);
        o.user = data.user;
      })
      .error(function(data, status, headers, config){
        if (status == 401){
          alert("You are not authorized");
          $location.url("/login");
          deferred.reject(data);
        }
      });
      return deferred.promise;
  }

  o.checkIfLoggedInAndAuth = function(whiteboard){
  }
  return o;
}]);

app.controller('login', ['$scope', 'user', '$http', function($scope, user, $http){
  $scope.login = function(){
    user.login({
      username: $scope.username,
      password: $scope.password
    });
  }
}]);

app.controller('create_whiteboard', ['whiteboards','$scope', '$http', function(whiteboards,$scope, $http){

  $scope.createWhiteboard = function(){
    whiteboards.create({
      title: $scope.title
    });
  }
}]);

app.controller('home', ['$scope','whiteboards','$timeout','user', function($scope, whiteboards, $timeout, user){
  $scope.user = whiteboards.whiteboards;
  $scope.user["theUser"] = whiteboards.whiteboards.theUser;
  console.log(whiteboards.whiteboards);
  $scope.whiteboards = whiteboards.whiteboards.whiteboards;

  if ($scope.user["theUser"] == $scope.user.local.username){
    $scope.isAuthor = true; 
  }

  $scope.logOut = function(){
    user.logOut();
  }

  $scope.$watch('whiteboards', function(){
    if ($scope.whiteboards == ''){
      $scope.empty = true;
    }
  });
  $scope.deleteBoard = function(unique_token){
    whiteboards.deleteBoard(unique_token).then(function(data){
      $scope.whiteboards = whiteboards.whiteboards.whiteboards;
    });
  }

}]);

app.controller('board', ['$scope', 'whiteboards','$timeout', function($scope, whiteboards, $timeout){
  $scope.users = [];
  var count = 0;
  var hash = {};
  var socket = io.connect('/room');
  var canvas = new fabric.Canvas('c');

  canvas.setWidth(window.innerWidth-205);
  canvas.setHeight(window.innerHeight-55);
  canvas.calcOffset();
  $scope.board = whiteboards.board;

  $timeout(function(){
    var obj = {};
    obj["unique_token"] = whiteboards.board.unique_token;
    obj["user"] = whiteboards.user;
    $scope.users.push(whiteboards.user);
    socket.emit("user", obj);

    whiteboards.canvas = canvas.toObject();
    whiteboards.canvas.objects = [];
    $scope.board.objects.forEach(function(canvasObj){
      whiteboards.canvas.objects.push(canvasObj);
    });
    canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));
    canvas.renderAll();
    canvas.getObjects().forEach(function(obj){
      hash[obj.unique_token] = obj;
      if (count < 2){
        console.log(hash[obj.unique_token]);
      }
      count++;
    });
    
  },200);

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


  canvas.freeDrawingBrush = ownerBrush;
  
  canvas.isDrawingMode = true;

  $scope.changeMode = function(){
    if (canvas.isDrawingMode){
    canvas.isDrawingMode = false;
    } else {
      canvas.isDrawingMode = true;
    }
  };
  $scope.clearCanvas = function(){
    canvas.clear();
    canvas.renderAll();
    whiteboards.canvas.objects = [];
    socket.emit("clear");
    
  };

  canvas.renderAll();
  var path;

  //socket events

  socket.on("clear", function(){
    canvas.clear();
    canvas.renderAll();
  });

  socket.on("userEnter", function(user){
    createBrush(user);
    $scope.users.push(user);
    $scope.$apply();
    socket.emit("userEnter", whiteboards.user); 
  });

  socket.on("userAlreadyConnected", function(user){
    createBrush(user);
    $scope.users.push(user);
    $scope.$apply();
  });
  
  socket.on("objectMove", function(coords){
    hash[coords.unique_token].left = coords.x;
    hash[coords.unique_token].top = coords.y;
    hash[coords.unique_token].setCoords();
    canvas.renderAll();
  });

  socket.on("objectAdded", function(object){
    console.log(object);

    whiteboards.canvas.objects.push(object);
    canvas.loadFromJSON(JSON.stringify(whiteboards.canvas));

    canvas.renderAll();

    canvas.getObjects().forEach(function(obj){
      hash[obj.unique_token] = obj;
    });
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
    })(activeObject.toObject)
    var obj = { object: activeObject, unique_token: activeObject.unique_token }

    socket.emit("objectModded", obj);
  });

  canvas.on('object:added', function(obj){
    var target = obj.target;
    if ($scope.shapeAdded == true && obj.target.type != 'path'){

      console.log(target.toObject());
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

  canvas.on('object:moving', debounce(function(e){
    var activeObject = e.target;

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

  canvas.on("mouse:down", function(){
    if (canvas.isDrawingMode){
      isDrawing = true;
    }
  });

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
    obj.top = 250;
    obj.left = 250;
    obj.width = 30;
    obj.height = 30;
    obj.stroke = $scope.strokeColor || 'black';
    obj.strokeWidth = $scope.strokeWidth || 2;
    obj.fill = $scope.fillColor || 'black';
    obj.setCoords();
    $scope.shapeAdded = true;
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
          templateUrl: 'test1.html'
        })
        .state('login',{
          url:'/login',
          controller: 'login',
          templateUrl: 'login.ejs',
          resolve : {
            getPromise: ['user', function(user){

            }]
          }
        })
        .state('create', {
          url: '/createboard',
          controller: 'create_whiteboard',
          templateUrl: 'create.html',
          resolve: {
            checkIfLoggedInAndAuth: ['user',function(user){
              user.checkIfLoggedIn();
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
            getBoard: ['whiteboards', '$stateParams', function(whiteboards, $stateParams){
              whiteboards.getBoard($stateParams);
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
          }
        });
    $urlRouterProvider.otherwise('');
    }
]);





















