var files=["GSB","GPS","GU","BSB","BPS","BU"];
var levels=["SB","PS","U"];
var colours=["#377eb8","#4daf4a","#f781bf"];
var titles={
  "GSB.csv":"Grooms - Secondary and Below",
  "GPS.csv":"Grooms - Post Secondary",
  "GU.csv" :"Grooms - University",
  "BSB.csv":"Brides - Secondary and Below",
  "BPS.csv":"Brides - Post Secondary",
  "BU.csv" :"Brides - University",
};
var q = d3.queue();
q.defer(Educationlinechart,0);
q.defer(Educationlinechart,1);
q.defer(Educationlinechart,2);
q.defer(Educationlinechart,3);
q.defer(Educationlinechart,4);
q.defer(Educationlinechart,5);
q.await(function(error) {
});

d3.select("body")
.style("position","relative")
.insert("g",":nth-child(3)")
.style("position","absolute")
.attr("width", 100)
.attr("height", 110)
.style("top", 700)
.style("left", 50)
.append("foreignObject",":nth-child(2)")
.attr("width", 100)
.attr("height", 110)
.append("xhtml:body")
.style("fill", "#b2b2b2")
.attr("class", "noselect")
.attr("class", "color-labels")
.html(function() {
  return "<svg width='10' height='10'> \
        <rect width='10' height='10' style='fill:#377eb8;opacity: 0.5;' /> \
      </svg> \
        Secondary & Below  <br>\
      <svg width='10' height='10'> \
        <rect width='10' height='10' style='fill:#4daf4a;opacity: 0.5;' /> \
      </svg> \
        Post-secondary <br>\
      <svg width='10' height='10'> \
        <rect width='10' height='10' style='fill:#f781bf;opacity: 0.5;' /> \
      </svg> \
        University <br>";
});

var margin = {top: 20, right: 65, bottom: 20, left: 50},
width2 = 325 - margin.left - margin.right,
height2 = 200 - margin.top - margin.bottom;

var x = d3.scaleLinear().range([0, width2]);
var y = d3.scaleLinear().range([height2, 0]);
var maxy=0;
var bisectYear=d3.bisector(function(d){return d.Year}).left;



function Educationlinechart(i,callback){
  var filename=files[i]+".csv";
  d3.csv("csv/"+filename, function(error, loaded) {
   if (error) throw error;
   var g=d3.select(".line-chart-container").attr("width",width2*3).append("svg")
   .attr("width", width2 + margin.left + margin.right)
   .attr("height", height2 + margin.top + margin.bottom)
   .append("g")
   .attr("width", width2 + margin.left + margin.right)
   .attr("height", height2 + margin.top + margin.bottom)
   .attr("class",function(d){return filename+" chart";})
   .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

   x.domain([1984,2015]);
   y.domain([0,14137]);
   g.append("text").text(titles[filename]).attr("y",-10).style("font-size","12px");

   for (i=0;i<levels.length;i++){
    var valueline = d3.line()
    .x(function(d) { return x(+d.Year); })
    .y(function(d) { return y(+d[levels[i]]); });
    data1=loaded;
    //console.log(i);
    //debugger;
    
    g.append("path")
    .data([data1])
    .attr("class", function(){return "line line"+(i+1);})
    .attr("d", valueline).attr("stroke",colours[i]);
  }
           /*g.append("path")
           .data([data2])
           .attr("class", "line line2")
           .attr("d", valueline);
           g.append("path")
           .data([data3])
           .attr("class", "line line3")
           .attr("d", valueline);*/


           var Xaxis=g.append("g")
           .attr("transform", "translate(0," + height2 + ")")
           .call(d3.axisBottom(x).tickArguments([6]).tickFormat(d3.format("0.0f")).tickSize(2.3)).attr("class","xaxis axis").style("opacity",0.5);


           var Yaxis=g.append("g")
           .call(d3.axisLeft(y).tickArguments([5]).tickFormat(d3.format("0.0f")).tickSize(2.3)).attr("class","yaxis axis").style("opacity",0.5);

           var tooltip=g.append("g").attr("class","tooltip").style("display","none");
           tooltip.append("line").attr("class","marker").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",height2);
           tooltip.append("g").attr("class","description").attr("x",10).attr("y",10).append("rect").attr("width",40).attr("height",16*(colours.length+1));

           g.append("rect")
           .attr("width", width2)
           .attr("height", height2)
           .attr("class","overlay")
           .on("mouseover",function(){
            d3.selectAll(".description").selectAll("text").remove();
            d3.selectAll(".tooltip").style("display",null)})
           .on("mouseout",function(){
            d3.selectAll(".description").selectAll("text").remove();
            d3.selectAll(".tooltip").style("display","none");})
           .on("mousemove",function(){


            d3.selectAll(".description").selectAll("text").remove();
            mouseX=d3.mouse(this)[0];
            x0=x.invert(d3.mouse(this)[0]);

            index=bisectYear(data1,x0);

            dl=data1[index];


            if(dl!=undefined){
              year=dl.Year;

              d3.selectAll(".tooltip").style("display",null).attr("transform",function(){return "translate("+mouseX+","+"0)";})
              .each(function (d,i){
                var text="";


                toolt=d3.select(this);
                toolt.select(".description").append("text").text(+year).style("font-weight","bold").style("fill","#bbb").attr("y","1.2em").attr("x",5);
                pth=d3.select(this.parentElement).selectAll(".line").each(function (d,i){
                  text=d[+year-1984][levels[i]];
                      ////console.log(i);
                      col=d3.select(this).style("stroke");
                      toolt.select(".description").append("text").text(text).style("fill",col).attr("y",function(){return (i+2)*1.2+"em" ;}).attr("x",5);

                    });

              });
            }});

         });
  callback(null);
}
