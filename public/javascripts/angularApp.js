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
            console.log($scope.usernameFree);
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
    return $http.delete('/board/delete/'+unique_token)
      .success(function(data){
        var boa = $filter('filter')(o.whiteboards.whiteboards, function(boards){
          return boards.unique_token == unique_token;})[0];
        delete boa;
      }).error(function(data, status, headers, config){
        if (status == 403){
          alert("you are not logged in");
          $location.url("/login");
        } else if (status == 401){
          alert("You are not authorized");
        }
      });
  }

  o.getUsersWhiteboards = function(username){
    return $http.get('/user/'+ username)
      .success(function(data){
        angular.copy(data, o.whiteboards);
        console.log(o.whiteboards);
      }).error(function(data){
        alert(data);
      });
  }
  o.getBoard = function(params){
    var deferred = $q.defer();
    return $http.get('/user/'+params.username+'/board/'+params.slug+'?unique_token='+params.unique_token)
      .success(function(data){
        deferred.resolve(data);
        angular.copy(data.whiteboard, o.board);
        o.user = data.user;
      })
      .error(function(data, status, headers, config){
        if (status == 401);{
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

app.controller('home', ['$scope','whiteboards', function($scope, whiteboards){
  $scope.user = whiteboards.whiteboards;
  $scope.whiteboards = whiteboards.whiteboards.whiteboards;

  $scope.$watch('whiteboards', function(){
    if ($scope.whiteboards == ''){
      $scope.empty = true;
    }
  });
  $scope.deleteBoard = function(unique_token){
    alert(unique_token);
    whiteboards.deleteBoard(unique_token);
  }

}]);

app.controller('board', ['$scope', 'whiteboards','$timeout', function($scope, whiteboards, $timeout){
  $scope.users = [];
  var socket = io.connect('/room');
  $scope.board = whiteboards.board;
  $timeout(function(){
    var obj = {};
    obj["unique_token"] = whiteboards.board.unique_token;
    obj["user"] = whiteboards.user;
    socket.emit("user", obj);
  },500);

  var canvas = new fabric.Canvas('c');

  var rect = new fabric.Rect({height: 30, width: 30, fill:'#f55', top:canvas.getHeight()/2 - 30, left:canvas.getWidth()/2});

  rect.toObject = (function(toObject){
    return function(){
      return fabric.util.object.extend(toObject.call(this),{
        unique_token: this.unique_token
      });
    };
  })(rect.toObject)

  rect.unique_token = 'd59sbz1';


  canvas.add(rect);

  var brush = new fabric.PencilBrush(canvas);
  brush.width = 1;
  canvas.freeDrawingBrush = brush;
  
  canvas.isDrawingMode = true;

  $scope.changeMode = function(){
    if (canvas.isDrawingMode){
    canvas.isDrawingMode = false;
    } else {
      canvas.isDrawingMode = true;
    }
  };

  canvas.renderAll();
  var path;

  //socket events
  socket.on("user", function(user){
    $scope.users.push(user);
    $scope.$apply();
  });
  
  socket.on("objectMove", function(coords){
    debugger;
    canvas.getObjects().forEach(function(obj){
      if (obj.unique_token == coords.unique_token){
        obj.left = coords.x;
        obj.top = coords.y;
        obj.setCoords();
        canvas.renderAll();
      }
    });
  });

  socket.on("mouseup", function(){
    brush._points = [];
  });

  socket.on("draw", function(thePath){
    var canvasObj = canvas.toObject();
    canvasObj.objects = [];
    canvas.getObjects().forEach(function(obj){
      obj.toObject = (function(toObject){
        return function(){
          return fabric.util.object.extend(toObject.call(this),{
            unique_token: this.unique_token
          });
        };
      })(obj.toObject)
      console.log(obj);
      canvasObj.objects.push(obj); 
    });
    console.log(canvasObj);
    canvasObj.objects.push(thePath);
    console.log(JSON.stringify(canvasObj));
    canvas.loadFromJSON(JSON.stringify(canvasObj));
    canvas.renderAll();
  });
  socket.on("drawing",function(points){
    brush.onMouseMove(points);
  });

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
      var points = { x: e.e.offsetX, y: e.e.offsetY };
      socket.emit("drawing", points);
    }
  });
  
  canvas.on('object:modified', function(object){
    var activeObject = object.target;
    var obj = { oCoords: activeObject.oCoords, unique_token: activeObject.unique_token }

    socket.emit("objectModded", obj);
  });

  canvas.on('object:moving', debounce(function(e){
    var activeObject = e.target;
    console.log(activeObject);

    var coords = { x: activeObject.get('left'), y: activeObject.get('top'), unique_token: activeObject.unique_token }
    socket.emit("objectMove", coords);
  },12));

  canvas.on("mouse:up",function(){
    isDrawing = false;
    socket.emit("mouseup");
  });

  canvas.on("path:created", function(e){
    path  = e.path;
    path.toObject = (function(toObject){
      return function(){
        return fabric.util.object.extend(toObject.call(this),{
          unique_token: this.unique_token
        });
      };
    })(path.toObject)

    path.unique_token = makeid();
    var json = path.toJSON();

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
  $scope.addShape = function(){
    var rect = new fabric.Rect();
    rect.toObject = (function(toObject){
      return function(){
        return fabric.util.object.extend(toObject.call(this),{
          unique_token: this.unique_token
        });
      };
    })(rect.toObject)
  }

  function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 7; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }


}]);


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





















