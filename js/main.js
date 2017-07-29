var app = angular.module('TumbViewer',['ngRoute','ngStorage']);


app.controller('mainCtrl', function($scope, $window){  
  
  $scope.blogFound = "";
  
  $scope.search = function(searchTerm){
    $window.location.href="#blog/"+searchTerm;
    $scope.searchTerm = "";
  };
});


app.controller('blogCtrl', function($scope, $route, $localStorage, tumblrAPI, dataAPI) {
  $scope.$parent.$route = $route;
  $scope.blogName = "";
  $scope.searchResult = "empty";
  $scope.errorBlog = "";
  $scope.blogAvatar = "";
  $scope.likes = [];
  $scope.offset=0;
  $scope.teste = "nada";
  
  $scope.myLikes = [];
  
  $scope.myLikes = dataAPI.loadLikes();
  
  $scope.searchBlog = function(searchTerm){
    tumblrAPI.getInfo(searchTerm)
    .success(function(data){
      $scope.searchResult = "found";
      $scope.blogName=searchTerm;
      $scope.blogAvatar = tumblrAPI.getAvatar(searchTerm);
      
      if(data.response.blog.share_likes){
        $scope.getLikes(searchTerm,0);
      }
      
    })
    .error(function(data){
      $scope.searchResult = "notFound";
      $scope.errorBlog = " teste";
      $scope.teste = data;
    });
  };
  
  $scope.getLikes = function(searchTerm, offset){
    tumblrAPI.getLikes(searchTerm,offset)
    .success(function(data){
        
      data.response.liked_posts.forEach(function(like){
        if(like.type === "photo"){
          like.photos.forEach(function(photo){
            var aux = createData(like.type, like.blog_name, like.id, photo.original_size.url,"");
            $scope.likes.push(aux);
          });
          
        }
        else if(like.type === "video"){
          var aux = createData(like.type, like.blog_name, like.id, like.thumbnail_url, like.video_url);
          $scope.likes.push(aux);
        }
      });
      
      $scope.offset = $scope.offset + 20;
      
    });
  };
  
  $scope.likePost = function(like){
    if(!like.liked){
      $scope.likes.forEach(function(el){
        if(el.blog == like.blog && el.id == like.id){
          dataAPI.insertLike(el);
          el.liked = true;
        }
      });
    }
  };
  
  $scope.dislikePost = function(like){
    dataAPI.removeLike(like);
  };
  
  var createData = function(type, blog_name, id, imgsrc, videosrc){
    
    var liked = false;
    
    liked = $scope.myLikes.some(function(el){
      return el.blog == blog_name && el.id == id;
    });
    
    return {
      "type":type,
      "blog":blog_name,
      "id": id,
      "imgsrc": imgsrc,
      "videosrc":videosrc,
      "liked":liked
    };
  };
  
  
  if($route.current.params.blogname){
    $scope.blogToSearch = $route.current.params.blogname;
    $scope.searchBlog($route.current.params.blogname);
  }
  
});

app.controller('likesCtrl',function($scope, $route, $localStorage, dataAPI, tumblrAPI){
  $scope.$parent.$route=$route;
  
  $scope.loadLikes = function(like){
    $scope.likes = dataAPI.loadLikes();
  };
  
  $scope.dislikePost = function(like){
    dataAPI.removeLike(like);
    $scope.loadLikes();
  };
  
  $scope.loadLikes();
  
});

app.controller('similarCtrl',function($scope, $route, $localStorage, $window, dataAPI, tumblrAPI){
  $scope.$parent.$route=$route;
  
  $scope.similar = [];
    
  
  $scope.loadSimilar = function(){
    var likes = dataAPI.loadLikes();
    
    $scope.similar = [];
    
    likes.forEach(function(like){
      tumblrAPI.getPost(like.blog, like.id)
      .success(function(data){
        data.response.posts[0].notes.forEach(function(note){
          if(note.type=="like"){
            getBlogInfo(note.blog_name);
          }
        });
      });
    });
  };
  
  $scope.LikedPosts = [];
  $scope.blogsSimilar = [];
  
  $scope.newLoadSimilar = function(){
    
    var likes = dataAPI.loadLikes();
      
    likes.forEach(function(el){
        
      if(!$scope.LikedPosts.some(function(li){
          return el.blog == li.blog && el.id==li.id;
      })){
          var lp = {
              "blog": el.blog,
              "id": el.id  
          }
        
          $scope.LikedPosts.unshift(lp);
      }
    });
    
    
    if($scope.LikedPosts.length > 0){
        
        var aux = $scope.LikedPosts.pop();
        
        fetchLikes(aux);
      }
    
  };
  
  var fetchLikes = function(like){
    
    tumblrAPI.getPost(like.blog, like.id)
    .success(function(data){
      data.response.posts[0].notes.forEach(function(note){
        if(note.type=="like"){
          
          if(!$scope.blogsSimilar.some(function(el){
              return el.name == note.blog_name;  
            })){
              var blog = {
                name: note.blog_name,
                count: 1
              };
              
              $scope.blogsSimilar.push(blog);
          }
          else{
            $scope.blogsSimilar.forEach(function(el){
              if(el.name == note.blog_name){
                el.count = el.count+1;
              }
            });
          }
        }
      });
      
      
      if($scope.LikedPosts.length > 0){
        var aux = $scope.LikedPosts.pop();
        
        fetchLikes(aux);
      }
      else{
        updateBlogInfo();
      }
      
    })
    .error(function(data){

      
      if($scope.LikedPosts.length > 0){
        var aux = $scope.LikedPosts.pop();
        
        fetchLikes(aux);
      }
      else{
        updateBlogInfo();
      }
    });
  };
  
  var updateBlogInfo  = function(){
    
    $scope.similar=[];
    
    $scope.blogsSimilar.forEach(function(el){
      
      if(el.count>=1)
      {
        tumblrAPI.getInfo(el.name)
        .success(function(data){
          //console.log(data.response.blog);
          if(data.response.blog.share_likes){
            if(data.response.blog.likes > 0 && el.count >0){
              var blog = 
              {
                name:data.response.blog.name,
                url:data.response.blog.url,
                likes:data.response.blog.likes,
                count:el.count,
                percent: el.count/data.response.blog.likes
              };
            
              $scope.similar.push(blog);
            }
          }
        });
      }
    });
    
  };
  
  
  
  var getBlogInfo = function(blog){
    tumblrAPI.getInfo(blog)
    .success(function(data){
      if(data.response.blog.share_likes){
        var blog = 
        {
          name:data.response.blog.name,
          url:data.response.blog.url,
          likes:data.response.blog.likes,
          count:1
        };
        
        if(!$scope.similar.some(function(el){
          return el.name==blog.name;
        })){
          $scope.similar.push(blog);
        }
        else{
          $scope.similar.forEach(function(el){
            if(el.name == blog.name){
              el.count = el.count+1;
            }
          });
        }
        
      }
    });
  };
  
  $scope.saveLocal = function(){
    dataAPI.insertSimilar($scope.similar);
  };
  
  $scope.navigate = function(blog){
    $window.location.href="#blog/"+blog;
  };
  
  var auxSimilar = [];
  
  auxSimilar = dataAPI.loadSimilar();
  
  if(auxSimilar){
    $scope.similar = auxSimilar;
  }
  
});


app.controller("TumbViewerCtrl",function($scope,tumblrAPI){
    $scope.teste="Rafael";
    
    
});


app.component('postGallery',{
  templateUrl: 'templates/postGallery.html',
  controller: function(){
    var likePost = function(like){
      console.log(like);
    };
  },
  bindings:{
    likes:"="
  }
});

var postGalleryCtrl = function(){
  var likePost = function(like){
    console.log(like);
  };
};

app.factory("dataAPI",function($localStorage){
  
  var _insertLike = function(like){
    if(!$localStorage.likes){
      $localStorage.likes = [];
    }
    
    $localStorage.likes.unshift(like);
  };
  
  var _removeLike = function(like){
    var auxLikes = [];
    
    auxLikes = $localStorage.likes.filter(function(el){
      return el.blog != like.blog && el.id!=like.id;
    });
    
    $localStorage.likes = auxLikes;
    
  };
  
  var _loadLikes = function(){
    var likes = [];
    
    if($localStorage.likes){
      likes = $localStorage.likes;
    }
    
    return likes;
  };
  
  var _loadSimilar = function(){
    var similar = [];
    
    if($localStorage.similar){
      similar = $localStorage.similar;
    }
    
    return similar;
  };
  
  var _insertSimilar = function(similar){
    $localStorage.similar = similar;
  };
  
  return{
    insertLike : _insertLike,
    loadLikes : _loadLikes,
    removeLike : _removeLike,
    loadSimilar : _loadSimilar,
    insertSimilar: _insertSimilar
  };
});

app.factory("tumblrAPI",function($http){
    
    var baseUrl = 'https://api.tumblr.com/v2/blog/';
    var apiKey = '?api_key=sNCvOfqUTzUJzBOViCbYfkaGeQaFAS4Q4XNtHMu8YPo6No3OiY';
    var blogBase = ".tumblr.com";
    var callback = "&callback=JSON_CALLBACK";
    
    var _getPost = function(blogName,id){
      
      var call = baseUrl + blogName + "/posts" + apiKey + "&notes_info=true&id=" + id + callback;
      
      return $http.jsonp(call);
      
    };
    
    var _getLikes = function(blogName, offset){
        
        var offstring = "&offset=" + offset;
        
        var call = baseUrl + blogName + blogBase +"/likes"+ apiKey + offstring + callback;
        
        return $http.jsonp(call);
    };
    
    var _getInfo = function(blogName){
        var call = baseUrl + blogName + blogBase + "/info" + apiKey + callback;
        
        return $http.jsonp(call);
    };
    
    var _getAvatar = function(blogName){
      var call = baseUrl + blogName + blogBase + "/avatar/64";

      return call;
    };
    
    
    
    return {
        getLikes : _getLikes,
        getInfo : _getInfo,
        getAvatar: _getAvatar,
        getPost : _getPost
    };
    
});

