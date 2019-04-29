# Careem Uni-Directional Voice Notes 

Allow driver to send voice notes to all passengers.
## Getting Started

clone the repo to setup the application.

### Prerequisites

Node.js installed.


follow this link: [here](https://nodejs.org/en/download/)

### Installing

change working directory to project root path and execute the following:

```
npm install
```

## Running

System is run by executing: 
```
npm start
```
## Deployment

deployed at [heroku](http://careem-test.herokuapp.com/):

## Using web pages to test functionality

Even though the program is made for APIs, web pages was created to ease the process of testing those APIs.

### /subscribe
- use this page to allow a passenger with trip_id to subscribe for a specific journey so he can get notes.
- if user is already subscribed, notes recorded after his subscription will appear in this page.
- if it's a new subscription, any new notes recorded after subscription will show up at real time.
- user can end subscription to simulate getting on board.
## Assumptions

* User can only hear notes recorded after their subscription.
* 
## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
