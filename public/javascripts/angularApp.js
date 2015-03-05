var app = angular.module('whiteboard', []);

app.controller('login', ['$scope', '$http','$timeout', function($scope, $http, $timeout){

  $scope.$watch('username', function(){
    if ($scope.username.length > 3){
     $scope.getUsername(); 
    }
  });

  $scope.getUsername = function(){
    $scope.loadingUser = true;
    return $http.get('/checkusername?username='+$scope.username)
      .success(function(data){
      $timeout(function(){
        $scope.loadingUser = false;
        $scope.usernameFree = true;
      },1000);
      }).error(function(data){
        $timeout(function(){
          $scope.loadingUser = false;
          $scope.usernameFree = false;
        });
      });
  }

}]);
