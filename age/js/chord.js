
var width = 900,
    height = 620,
    outerRadius = Math.min(width, height) / 2 - 100,
    innerRadius = outerRadius - 18;
var dataset;
var duration = 200;
var formatPercent = d3.format("%");
var numberWithCommas = d3.format("0.0f");
var m0, dm, offset;
var stepSlider = document.getElementById('slider');
var mouse_rotate = false;
var playing = false;
var slider_value = 1;
var firstrun = true;
var tid = setTimeout(mycode, 200);
var old_angle = 0;
var last_layout;
var neighborhoods;

function getDefaultLayout() {
    return d3.layout.chord()
        .padding(0.03)
        .sortSubgroups(d3.descending)
        .sortChords(d3.ascending);
}

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var path = d3.svg.chord()
    .radius(innerRadius);

var chart = d3.select("#chart_placeholder").append("svg")
    .attr("width", width)
    .attr("height", height);

var label = chart.append('g');

var g = chart
    .append("g")
    .attr("id", "circle")
    .attr("transform",
        "translate(" + width / 2 + "," + height / 2 + ")");

g.append("circle")
    .attr("r", outerRadius)
    .attr("id", "rotate-reference");

g.append("text")
    .attr("y", -outerRadius * 1.1)
    .attr("x", outerRadius * 0.2)
    .attr("class", "noselect")
    .text(function(d) {
        return '\uf221'
    })
    .style("fill", "#b2b2b2")
    .attr('font-family', 'FontAwesome')
    .attr('font-size', function(d) {
        return "50px"
    });

g.append("text")
    .attr("y", -outerRadius * 1.1)
    .attr("x", -outerRadius * 0.4)
    .attr("class", "noselect")
    .text(function(d) {
        return '\uf222'
    })
    .style("fill", "#b2b2b2")
    .attr('font-family', 'FontAwesome')
    .attr('font-size', function(d) {
        return "43px"
    });

g.append("line")
    .attr("x1", -4)
    .attr("y1", -outerRadius * 1.3)
    .attr("x2", 4)
    .attr("y2", outerRadius * 1.3)
    .style("stroke-dasharray", ("3, 3"))
    .style("stroke", "#b2b2b2")
    .style("stroke-width", 2)
    .style("opacity", 0.6);


label.append("foreignObject")
    .attr("width", 400)
    .attr("height", 300)
    .attr("y", 400)
    .attr("x", 100)
    .append("xhtml:body")
    .style("fill", "#b2b2b2")
    .attr("class", "noselect")
    .attr("class", "color-labels")
    .html(function() {
        return "<div class='color-labels-box' style = 'background: #e41a1c'> </div> Under 20 <br /><br /> <div class='color-labels-box' style = 'background: #377eb8'> </div> 20-24 <br /> <br /><div class='color-labels-box' style = 'background: #4daf4a'> </div> 25-29 <br /><br /><div class='color-labels-box' style = 'background: #984ea3'> </div> 30-34 <br /><br /><div class='color-labels-box' style = 'background: #ff7f00'> </div> 35-39 <br /><br /><div class='color-labels-box' style = 'background: #DAC237'> </div> 40-44 <br /><br /><div class='color-labels-box' style = 'background: #a65628'> </div> 45-49 <br /><br /><div class='color-labels-box' style = 'background: #f781bf'> </div> 50 and Above <br /><br />";
    });

d3.csv("data/colors.csv", function(rel) {
    d3.json("data/matrix.json", function(matrix) {
        dataset = matrix;
        neighborhoods = rel;
        updateChords(dataset[0]);

        noUiSlider.create(stepSlider, {
            start: [0],
            step: 1,
            range: {
                'min': [0],
                'max': [31]
            },
        });

        stepSlider.noUiSlider.on('update', function(values, handle) {
            slider_value = parseInt(values);
            updateChords(dataset[parseInt(values)]);
        });
    });
});


function updateChords(matrix) {

    layout = getDefaultLayout();
    layout.matrix(matrix);

    var groupG = g.selectAll("g.group")
        .data(layout.groups(), function(d) {
            return d.index;
        });

    groupG.exit()
        .transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove();

    var newGroups = groupG.enter().append("g")
        .attr("class", "group");

    newGroups.append("title");

    groupG.select("title")
        .text(function(d, i) {
            return numberWithCommas(d.value) +
                " " +
                neighborhoods[i].name;
        });

    newGroups.append("path")
        .attr("id", function(d) {
            return "group" + d.index;
        })
        .style("fill", function(d) {
            return neighborhoods[d.index].color;
        });

    groupG.select("path")
        .transition()
        .duration(duration)
        .attr("opacity", 0.55)
        .attrTween("d", arcTween(last_layout));

    var chordPaths = g.selectAll("path.chord")
        .data(layout.chords(), chordKey);

    var newChords = chordPaths.enter()
        .append("path")
        .attr("class", "chord");

    newChords.append("title");
    chordPaths.select("title")
        .text(function(d) {
            if (neighborhoods[d.target.index].name !== neighborhoods[d.source.index].name) {
                //console.log(d.source.value);
                return [numberWithCommas(d.source.value),
                    " ",
                    neighborhoods[d.source.index].name,
                    "married ",
                    neighborhoods[d.target.index].name,
                ].join("");
            } else {
                return numberWithCommas(d.source.value) +
                    " started and ended in " +
                    neighborhoods[d.source.index].name;
            }
        });

    chordPaths.exit().transition()
        .duration(duration)
        .attr("opacity", 0)
        .remove();

    chordPaths.transition()
        .duration(duration)
        .attr("opacity", 0.5)
        .style("fill", function(d) {
            return neighborhoods[d.source.index].color;
        })
        .attrTween("d", chordTween(last_layout))
        .transition().duration(duration).attr("opacity", 0.5);

    groupG.on("mouseover", function(d) {
        chordPaths.classed("fade", function(p) {
            return ((p.source.index != d.index) && (p.target.index != d.index));
        });
    });

    last_layout = layout;

    if (!offset) {
        offset = $("#rotate-reference").offset();
    }
}

function arcTween(oldLayout) {
    var oldGroups = {};
    if (oldLayout) {
        oldLayout.groups().forEach(function(groupData) {
            oldGroups[groupData.index] = groupData;
        });
    }

    return function(d, i) {
        var tween;
        var old = oldGroups[d.index];
        if (old) {
            tween = d3.interpolate(old, d);
        } else {
            var emptyArc = {
                startAngle: d.startAngle,
                endAngle: d.startAngle
            };
            tween = d3.interpolate(emptyArc, d);
        }

        return function(t) {
            return arc(tween(t));
        };
    };
}

function chordKey(data) {
    return (data.source.index < data.target.index) ?
        data.source.index + "-" + data.target.index :
        data.target.index + "-" + data.source.index;
}

function chordTween(oldLayout) {
    var oldChords = {};

    if (oldLayout) {
        oldLayout.chords().forEach(function(chordData) {
            oldChords[chordKey(chordData)] = chordData;
        });
    }

    return function(d, i) {
        //this function will be called for each active chord

        var tween;
        var old = oldChords[chordKey(d)];
        if (old) {
            //old is not undefined, i.e.
            //there is a matching old chord value

            //check whether source and target have been switched:
            if (d.source.index != old.source.index) {
                //swap source and target to match the new data
                old = {
                    source: old.target,
                    target: old.source
                };
            }

            tween = d3.interpolate(old, d);
        } else {
            //create a zero-width chord object
            var emptyChord = {
                source: {
                    startAngle: d.source.startAngle,
                    endAngle: d.source.startAngle
                },
                target: {
                    startAngle: d.target.startAngle,
                    endAngle: d.target.startAngle
                }
            };
            tween = d3.interpolate(emptyChord, d);
        }

        return function(t) {
            //this function calculates the intermediary shapes
            return path(tween(t));
        };
    };
}

function mycode() {
    // do some stuff...
    if (slider_value < 31 && playing == 1 && !firstrun) {
        stepSlider.noUiSlider.set(slider_value);
        slider_value = slider_value + 1;
        document.getElementById("play").src = "images/pause.png";
    }
    else if (slider_value == 31) {
        playing = 2;
        document.getElementById("play").src = "images/reset.png";
    }
    else if (slider_value < 31 && playing == 2 && !firstrun) {
        document.getElementById("play").src = "images/pause.png";
        playing=1;
    }
    tid = setTimeout(mycode, duration);
}

function abortTimer() { // to be called when you want to stop the timer
    clearTimeout(tid);
}

$(document).ready(function() {
    var play_icon = $('#play');
    var for_icon = document.getElementById("play");
    play_icon.click(function() {
        firstrun = false;
        if (playing == 1) {
            //debugger;
            playing = 0;
            for_icon.src = "images/play.png";
        } else if (playing == 0) {
            playing = 1;
            for_icon.src = "images/pause.png";
        } else if (playing == 2) {
            //debugger;
            playing = 1;
            slider_value = 0;
        }
    });
});

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
}

d3.select("#chart_placeholder")
    .on("mousemove", mousemove)
    .on("mouseup", mouseup)
    .on("mousedown", mousedown);

function mouse(e) {
    if (e != undefined) {
        e.preventDefault();
    }
    return [e.pageX - offset.left - outerRadius, e.pageY - offset.top - outerRadius];
}

function mousemove(e) {
    var m1 = mouse(d3.event);
    if (e != undefined) {
        e.preventDefault();
    }
    if (m0 && mouse_rotate) {
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
        if (dm > 0) {
            dm = -(360 - dm);
        }
        d3.select("#circle").style("transform", "translate(" + (width / 2) + "px, " + (height / 2) + "px) rotate(" + (dm + old_angle) + "deg)");
    }
    if (Math.sqrt((m1[0]) * (m1[0]) + (m1[1]) * (m1[1])) < innerRadius) {
        $('html,body').css('cursor', 'move');
    } else {
        $('html,body').css('cursor', 'default');
    }
}

function mouseup(e) {
    if (e != undefined) {
        e.preventDefault();
    }
    if (mouse_rotate) {
        old_angle = dm + old_angle;
        mouse_rotate = false;
    }
    $('html,body').css('cursor', 'default');
}

function mousedown(e) {
    if (e != undefined) {
        e.preventDefault();
    }
    m0 = mouse(d3.event);
    if (Math.sqrt((m0[0]) * (m0[0]) + (m0[1]) * (m0[1])) < innerRadius) {
        mouse_rotate = true;
        $('html,body').css('cursor', 'move');
    }
}

function cross(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}
