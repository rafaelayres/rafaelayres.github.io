app.config(function($routeProvider){
  $routeProvider
    .when('/',{
      templateUrl : 'templates/blog.html',
      controller : 'blogCtrl',
      activetab: 'blog'
    })
    .when('/likes',{
      templateUrl : 'templates/likes.html',
      controller: 'likesCtrl',
      activetab: 'likes'
    })
    .when('/blog/:blogname',{
      templateUrl : 'templates/blog.html',
      controller : 'blogCtrl',
      activetab: 'blog'
    })
    .when('/similar',{
      templateUrl : 'templates/similar.html',
      controller: 'similarCtrl',
      activetab: 'similar'
    })
    .otherwise({redirectTo : "/"});
});
