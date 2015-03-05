var app = angular.module('whiteboard', []);

app.controller('login', ['$scope', '$http','$timeout', function($scope, $http, $timeout){

  $scope.$watch('username', function(){
    if ($scope.username.length > 3){
     $scope.getUsername($scope.username); 
    }
  });

  $scope.$watch('email', function(){
    if ($scope.email.match(/\w+@\w+.(com|gov|org|net|\w+.edu)/)){
      $scope.getUsername($scope.email);
    }
  });

  $scope.getUsername = function(cred){
    $scope.loadingUser = true;
    return $http.get('/checkusername?username='+cred)
      .success(function(data){
      $timeout(function(){
        if (cred == $scope.email){
          $scope.loadingUser = false;
          $scope.emailFree = true;
        } else {
          $scope.loadingUser = false;
          $scope.usernameFree = true;
        }
      },500);
      }).error(function(data){
        alert(data.message);
        $timeout(function(){
            alert("hi");
          if (cred == $scope.email){
            $scope.loadingUser = false;
            $scope.emailFree = false;
          } else {
            $scope.loadingUser = false;
            $scope.usernameisFree= true;
          }
        });
      });
  }

}]);
