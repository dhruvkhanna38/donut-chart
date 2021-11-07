const dims = { height: 300, width: 300, radius: 150 };
const cent = { x: (dims.width / 2 + 5), y: (dims.height / 2 + 5)};

// create svg container
const svg = d3.select('.canvas')
  .append('svg')
  .attr('width', dims.width + 150)
  .attr('height', dims.height + 150);

const graph = svg.append('g')
  .attr("transform", `translate(${cent.x}, ${cent.y})`);
  // translates the graph group to the middle of the svg container

const pie = d3.pie()
  .sort(null)
  .value(d => d.cost);
  // the value we are evaluating to create the pie angles

const arcPath = d3.arc()
  .outerRadius(dims.radius)
  .innerRadius(dims.radius / 2);

const color = d3.scaleOrdinal(d3['schemeSet3'])

const legendGroup = svg.append('g')
                       .attr('transform', `translate(${dims.width + 40}, 10)`)

const legend = d3.legendColor()
                       .shape('path', d3.symbol().type(d3.symbolCircle)())
                       .shapePadding(10)
                       .scale(color)

// update function
const update = (data) => {

  color.domain(data.map(d => d.name))

  

  legendGroup.call(legend);
  legendGroup.selectAll('text').attr('fill', 'white');

  
  // join enhanced (pie) data to path elements
  const paths = graph.selectAll('path')
    .data(pie(data));

  paths.exit().transition().duration(750)
  .attrTween('d', arcTweenExit)
  .remove();

  paths.attr('d', arcPath)
       .transition().duration(750)
       .attrTween('d', arcTweenUpdate)


  paths.enter()
    .append('path')
      .attr('class', 'arc')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('fill', d=>color(d.data.name))
      .each(function(d){
         this._current = d;

      })
      .transition().duration(750)
         .attrTween('d', arcTweenEnter)
};

// data array and firestore
var data = [];

db.collection('expenses').orderBy('cost').onSnapshot(res => {

  res.docChanges().forEach(change => {

    const doc = {...change.doc.data(), id: change.doc.id};

    switch (change.type) {
      case 'added':
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex(item => item.id == doc.id);
        data[index] = doc;
        break;
      case 'removed':
        data = data.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }

  });

  // call the update function
  update(data);

});


const arcTweenEnter = (d) =>{
   let i = d3.interpolate(d.endAngle, d.startAngle)
   return function(t){
      d.startAngle = i(t)
      return arcPath(d)
   }
}

const arcTweenExit = (d) =>{
   let i = d3.interpolate(d.startAngle, d.endAngle)
   return function(t){
      d.startAngle = i(t)
      return arcPath(d)
   }
}

function arcTweenUpdate(d){
   let i = d3.interpolate(this._current, d)
   this._current = d;
   return function(t){
      return arcPath(i(t))
   }
}