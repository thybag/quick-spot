module.exports = function (grunt) {
	"use strict";

	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-eslint");

	grunt.initConfig({
		eslint: {
			all: {
				options: {
					configFile: "test/_eslint.json"
				},
				src: ["quickspot.js"]
			}
		},
		uglify: {
			all: {
				files: {
					"quickspot.min.js": ["quickspot.js"]
				}
			}
		},
		copy: {
			main: {
				src: 'quickspot.*',
				dest: 'demo/',
			},
		},
		connect: {
			all: {
				options: {
					port: 7070,
					hostname: "localhost",
					base: ["demo/"],
					livereload: 7071
				}
			}
		},
		watch: {
			all: {
				files: ["quickspot.js", "quickspot.css"],
				tasks: ["default"],
				options: {
					livereload: true
				}
			}
		}
	});

	grunt.registerTask('default', ['eslint', 'copy', 'uglify']);
	grunt.registerTask('server', ['eslint','copy', 'uglify', 'connect', 'watch']);
};
