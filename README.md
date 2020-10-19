# Herme<span>.</span>io

[Herme.io](#) is a social network made with NodeJS and ReactJS.

This repository contains the source code for the server side. For the client side check it out [here](https://github.com/adxl/herme.io_client).

## API

- #### HTTP GET:
  + **/dash** > GET current* user data
  + **/users/:id** > GET public user data
  + **/posts** > GET current* user
  + **/posts/friends** > GET current* user friends' posts     
  + **/friends** > GET current* user friends    
  + **/friends/find** > GET 3 (three) current* user non-friends users    
  + **/requests** > GET current* user friend requests     
- #### HTTP POST:
  + **/posts** > Create a post    
  + **/posts/like** > Like a post    
  + **/friends/remove** > Remove current* user friend    
  + **/requests/invite** > Send a friend request    
  + **/requests/cancel** > Cancel a friend request    
  + **/requests/accept** > Accept a friend request    
  + **/requests/deny** > Deny a friend request    
  + **/register** > Sign up    
  + **/login** > Sign in    
- #### HTTP DELETE:
  + **/posts** > Delete current* user post

**\*** needs an authorization token that will determinate the current user


## License

[MIT](https://github.com/adxl/herme.io_server/blob/master/LICENSE.md) &copy; [Adel Senhadji](https://github.com/adxl)