var inquirer = require("inquirer");
var axios = require("axios");
var fs = require('fs');
var genHTML= require("./generateHTML.js")
var convertFactory = require('electron-html-to')


function writeToFile(fileName, data) {


	var conversion = convertFactory({
		converterPath: convertFactory.converters.PDF
	});

	conversion({ html: genHTML.generateHTML(data) }, function(err, result) {
		if (err) {
			return console.error(err);
		}
		result.stream.pipe(fs.createWriteStream(`./${fileName}_Portfolio.pdf`));
		conversion.kill(); // necessary if you use the electron-server strategy, see bellow for details
	});


}

function init() {
	inquirer.prompt([
		{
			type: "input",
			name: "name",
			message: "Github UserName?"
		},
		{
			type: "input",
			name: "currentLoc",
			message: "Where are you at?"
		},
		{
			type: "list",
			message: "Favorite Color?",
			name: "favColor",
			choices: [
				"green", 
				"blue", 
				"pink", 
				"red"
			]
		},

	]).then(answers => {
		
		var gitData = {
			name: '', 
			imgUrl: '', 
			locationUrl:'',
			htmlUrl:'',
			blogUrl:'',
			numGit: 0, 
			numFollow: 0, 
			numFollowing: 0, 
			numStar: 0,
			color: 'blue',
			location: '',
			currentLoc: '',
			bio: '',
		}

		const queryRepos = `https://api.github.com/users/${answers.name}/repos`;
		const queryUser = `https://api.github.com/users/${answers.name}`;
		const queryStars = `https://api.github.com/users/${answers.name}/starred`;

		axios
			.all([axios.get(queryRepos), axios.get(queryUser), axios.get(queryStars)])
			.then(axios.spread((...res) => {

				const repoNames = res[0].data.map(function(repo) {
					return repo.name;
				});
				const repoNamesStr = repoNames.join("\n");
				const starNames = res[2].data.map(function(star) {
					return star.name;
				});
				const starList= starNames.join("\n");

				gitData.numGit = repoNames.length;
				gitData.name = res[1].data.name; 
				gitData.numStar = starList.length;
				gitData.imgUrl = res[1].data.avatar_url; 
				gitData.htmlUrl = res[1].data.html_url; 
				gitData.blogUrl = res[1].data.blog; 
				gitData.numFollow = res[1].data.followers; 
				gitData.numFollowing = res[1].data.following; 
				gitData.locationUrl = `https://www.google.com/maps/place/${res[1].data.location}`;
				gitData.color = answers.favColor;
				gitData.location = res[1].data.location;
				gitData.currentLoc = answers.currentLoc; 
				gitData.bio = res[1].data.bio; 

				writeToFile(gitData.name.replace(/\s/g, ""),gitData)
			}))
			.catch(errors => {
				console.log("error has occured")
			})
	})
}
init();
