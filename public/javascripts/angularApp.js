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
    board: {}
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
        angular.copy(data, o.board);
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

app.controller('board', ['$scope', 'whiteboards', function($scope, whiteboards){
  $scope.board = whiteboards.board;

    var canvas = new fabric.Canvas('c');
    canvas.add(new fabric.Circle({ radius: 30, fill: '#f55', top:canvas.getHeight()/2 - 30,left:canvas.getWidth()/2}));

    alert((JSON.stringify(canvas)));

    canvas.on('object:moving', function(e) {
      var activeObject = e.target;
      console.log(activeObject.id);
      console.log(activeObject.get('left'));
      console.log(activeObject.get('top'));
    });
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





















