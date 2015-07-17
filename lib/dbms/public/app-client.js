var kval = angular.module('kval', ['ngRoute']);
kval
    .controller('GlobalController', [
        '$rootScope', function ($rootScope) {
            $rootScope.password = localStorage.password;
        }
    ])
    .directive('passwordSetter', [
        '$rootScope', '$http', function ($rootScope, $http) {

        }
    ]);
