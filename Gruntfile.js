module.exports = function(grunt) {

    require("time-grunt")(grunt);

    grunt.initConfig({
        // read in the project settings from package.json into pkg propert. This allows us to refer
        // to the values of properties within our package.json
        pkg: grunt.file.readJSON("package.json"),

        // the configuration object for a task lives as a property on the configuration object,
        // that"s named the same as the task - so "watch" task goes in our config object under the "watch" key

        // watch task detects changes to files and runs specified tasks
        watch: {
            css: {
                files: "**/*.scss",
                tasks: ["compass"],
                options : {
                    livereload : false
                }
            },
            scripts: {
                files: "js/cassrmain.js",
                tasks : ["jshint", "uglify"],
                options: {
                    interrupt : true,
                    livereload : false
                }
            },
            livereload: {
                options: {
                    livereload: true
                },
                files: [
                    'css/stylesheets/*.css',
                    'js/dist/*.js'
                    //'images/{,**/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },

        // handles sass compliation using Compass setup in css/config.rb
        compass : {
            dist : {
                options: {
                    basePath : "css",
                    config : "css/config.rb"
                }
            }
        },

        imagemin: {
            png: {
                options: {
                    optimizationLevel: 7
                },
                files: [
                    {
                        // Set to true to enable the following options…
                        expand: true,
                        // cwd is 'current working directory'
                        cwd: 'i/',
                        src: ['**/*.png'],
                        // Could also match cwd line above. i.e. project-directory/img/
                        dest: 'i/compressed/',
                        ext: '.png'
                    }
                ]
            }
        },

        // uglify to concat, minify, and make source maps
        uglify: {
            dist: {
                options: {
                    sourceMap: 'js/map/source-map.js',
                    seperator : ";",
                    banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"dd-mm-yyyy\") %> */\n"
                },
                files: {
                    'js/dist/cassrmain.min.js': [
                        'js/lib/jquery/plugins/jquery.wrapChildren.js',
                        'js/lib/jquery/plugins/jquery.bxslider.js',
                        'js/cassrmain.js'
                    ]
                }
            }
        },

        // js linting
        jshint: {
            options: {
                jshintrc: "js/.jshintrc"
            },
            files: {
                src: ["Gruntfile.js", "js/cassrmain.js"]

            }
        }
    });

    //grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-compass");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", [
        "watch"
    ]);

    grunt.registerTask('imagemin', ['imagemin']);

    grunt.registerTask("build", [
        "jshint",
        "uglify"
    ]);
};
