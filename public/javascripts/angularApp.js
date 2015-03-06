var app = angular.module('whiteboard', []);

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
