### Sodra "info about company" scraper
Project for BA Challenge <br>
scuffed prototype

## to do
add proper data update (not dropping and reloading tables) <br>
add auto-update at midnight (after proper update implemented) <br>
add downloading data in csv <br>
add company code prediction in search bar? <br>
add promise to sodraUpdater.update() ? <br>
mdc frontend? <br>




## info
App uses MySQL. Start MySQL server and run
`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'uncrackablePassword'` <br>
(or use existing server)<br>
App creates new database on first launch