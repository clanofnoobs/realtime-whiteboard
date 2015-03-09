var users = angular.module('users', ['ui.router']);

users.controller('home', ['$scope','whiteboards', function($scope){
  $scope.whiteboards = whiteboards.whiteboards;
}]);

users.factory('whiteboards', ['$scope', '$http', '$location', '$q', function($scope, $http, $location, $q){
  var o = {
    whiteboards: []
  };

  o.getUsersWhiteboards = function(){
    return $http.get('/user/'+$stateParams.username)
      .success(function(data){
        angular.copy(data, o.whiteboards);
      }).error(function(data){

      });
  }
}]);

users.config({[
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $stateProvider
      .state('user_homepage', {
        url: '',
        controller: 'home',
        templateUrl: 'user.html'
        resolve: {
          getPromise : ['whiteboards', '$stateParams', function(whiteboards, $stateParams){
            return whiteboards.getUsersWhiteboards($stateParams.username);
          }]
        }
      });
  });
]})
