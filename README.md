# TrackMe 

TrackMe is a web application that tracks a user's time and allows the user to book at task and do other operations.

## Table of Contents
- [Installation](#installation)
- [What time I spent?](#time_spent)
- [What I liked and did not like](#The_Likes)
- [What I would do if I had more time?](#The_Alternatives)
- [With which part of this application am I satisfied with?](#The_Satisfaction)
- [Which part need improvement?](#The_Improvement)

## installation

1. clone the repository

```bash
    git clone https://github.com/Swaggie190/TrackMe.git
    cd TrackMe
```
2. environment settings

```bash
    cp .env.example .env
```
3. Docker build

```bash
    docker-compose up -d --build

    docker-compose run --rm init-db
```

4. Access application
```bash
    Frontend: http://localhost:3000
    Backend: http://localhost:8000/api/v1/
```
NOTICE: a demo user is automatically created : Demo_Login: demo@trackme.com / demo@123 , but unfortunately, there are login issues with this particular user, so the only way to test this application will be to register a user on the register page, do some few simulations and test other parts of this application.

Sorry for the inconviniences.


## time_spent

I am traditionally a springboot coder, and since i had stayed a long time without coding with the django framework, i took the first week to make some reviews and learn some concepts in django. I started the actuall coding the second week. So, 1 week for revising, 1 week for coding. I am already familiar with react, so it was straight forward.

## The_likes

- I liked the concept of frequently updating frontend data with the backend
- I liked the fact that i dived back into django, a framework which i hadn't touched in a while
- I did not like the time frame provided, it was too short especially for my condition
- In the beginning, i had a hard time to understand the project's objectives, even though i figured it out with time, it was initially hard.

## The_Alternatives

If i had more time, i would first update intensively the frontend ( i believe what a user see is what sells the app). Then, i would add more functionalities like team project tracking where many users can track their activities as a team.

## The_Satisfaction

Even though the frontend is not the best, i am nevertheless satisfied given the time spent and the result. I am also satisfied with the tracking logic, especially the sync functionality that frequently updates the frontend with up to date time informations. I am particularly glad i didn't have to use websockets to do it.

## The_Improvement

- The frontend!! like i earlier mentioned.
- Add websocket for better performance ( will eventually need it if the app had to scale)
