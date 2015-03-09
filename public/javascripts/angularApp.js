var app = angular.module('whiteboard', ['ui.router']);

app.controller('login', ['$scope', '$http','$timeout', function($scope, $http, $timeout){

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
      },500);
      }).error(function(data){
        $timeout(function(){
          if (cred == $scope.email){
            $scope.loadingEmail = false;
            $scope.eNotTaken = false;
            $scope.eTaken = true;
            alert(data.message);
          } else {
            $scope.loadingUser = false;
            $scope.userFree = false;
            $scope.userNotFree = true;
            console.log($scope.usernameFree);
          }
        }, 1000);
      });
  }

}]);

app.factory("whiteboards", ['$http','$q','$location', function($http, $q, $location){
  var o = {
    whiteboards : []
  };

  o.create = function(whiteboard){
    return $http.post('/createboard', whiteboard)
      .success(function(data){
        
      }).error(function(data){

      });
  }

  o.getUsersWhiteboards = function(){
    return $http.get('/user/'+$stateParams.username)
      .success(function(data){
        angular.copy(data, o.whiteboards);
      }).error(function(data){

      });
  }
  o.checkIfLoggedInAndAuth = function(whiteboard){
  }
  return o;
}]);

app.controller('create_whiteboard', ['$scope', '$http', function($scope, $http){

  $scope.createWhiteboard = function(){
    var board = {
      title: $scope.title
    }
    return $http.post('/createboard', board).success(function(data){
      console.log(data);
    }).error(function(data){
      alert(data);
    });
  }
}]);

app.controller('home', ['$scope','whiteboards', function($scope){
  $scope.whiteboards = whiteboards.whiteboards;
}]);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    'whiteboards',
    function($stateProvider, $urlRouterProvider, whiteboards){
      $stateProvider
        .state('home',{
          url:'',
          controller: 'home',
          templateUrl: 'test1.html'
        })
        .state('users', {
          url:'/user/{username}',
          controller: 'home',
          templateUrl: 'users.html'
        })
        .state('login',{
          url:'/login',
          controller: 'home',
          templateUrl: 'login.html'
        })
        .state('whiteboards', {
          url:'/user/{username}/boards/{slug}',
          controller: 'home',
          templateUrl: 'whiteboard.html'
        })
        .state('user_homepage', {
          url: '',
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





















