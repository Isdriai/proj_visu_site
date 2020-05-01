"use strict";


/**
 * Crée un objet ligne permettant de dessiner notre Line
 * 
 * @param x         Echelle sur l'axe x
 * @param y         Echelle sur l'axe y
 * @return {line}   L'objet Line
 */
function createLine(x, y) {
    return d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX) 
        // on voit bien les extremes mais on garde une certaine courbure pour garder une certaine esthétique,
        // la ou avec curveOpenBasis on perdait les extremes, voir doc
}

/**
 * Crée les échelles assignés à un LineChart
 * 
 * @param width                Largeur du groupe ou sera dessiné le LineChart
 * @param heightFocus          Hauteur du groupe ou sera dessiné le LineChart
 * @return {[Ladder, Ladder]}  Les échelles du LineChart
 */
function createLadders(width, heightFocus) {
    
    var xFocus = d3.scaleTime().range([0, width])
    var yFocus = d3.scaleLinear().range([heightFocus, 0])
    
    return [xFocus, yFocus]
}

/**
 * Crée une ligne qui sera ajouté à un graphique
 * 
 * @param g         Le groupe SVG dans lequel le graphique doit être dessiné.
 * @param datum     Données liées à cette LineChart.
 * @param line      La fonction permettant de dessiner les lignes du graphique.
 * @param color     L'échelle de couleurs ayant une couleur associée à un nom de rue.
 * @param name      Nom à donner à la LineChart.
 */
function createLineChart(g, datum, line, color, name, id) {
    return g.append("path")
      .datum(datum)
      .attr("class", "line" + id)
      .attr("d", line)
      .style("stroke", color(name))
      .attr("fill", "none")
  }

/**
 * Crée le graphique focus.
 *
 * @param g         Le groupe SVG dans lequel le graphique doit être dessiné.
 * @param sources   Les données à utiliser.
 * @param line      La fonction permettant de dessiner les lignes du graphique.
 * @param color     L'échelle de couleurs ayant une couleur associée à un nom de rue.
 */
function createFocusLineChart(g, sources, line, color) {
    // TODO: Dessiner le graphique focus dans le groupe "g".
    // Pour chacun des "path" que vous allez dessiner, spécifier l'attribut suivant: .attr("clip-path", "url(#clip)").
    Object.keys(sources).forEach(sect => {
        createLineChart(g, sources[sect], line, color, sect, "Focus").attr("clip-path", "url(#clip)")
    })
  }
  
/**
 * Crée les axes assignés à un LineChart via les échelles de ce dernier
 * 
 * @param xFocus                Echelle de l'axe x pour un LineChart
 * @param yFocus                Echelle de l'axe y pour un LineChart
 * @return {[Axis, Axis]}       Les axes du LineChart
 */
function createAxes(xFocus, yFocus) {
    var xAxisFocus = d3.axisBottom(xFocus)
    var yAxisFocus = d3.axisLeft(yFocus)
    return [xAxisFocus, yAxisFocus]
}

/**
 * créé le groupe ou sera déssiné un LineChart
 * 
 * @param group                 Groupe parent
 * @return {Group}              le groupe créé
 */function createGroups(group) {
    var focus = group.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")

    return focus
}

/**
 * Crée une légende à partir de la source.
 *
 * @param svg       L'élément SVG à utiliser pour créer la légende.
 * @param sources   Données triées par nom de rue et par date.
 * @param color     Échelle de 10 couleurs.
 */
function legend(group, height, width, sources, color) {
  
    var names = Object.keys(sources)
    var legend = group.append("g")
      .selectAll("g")
      .data(names)
      .enter()
      .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
          var heightCase = height / (names.length * 2)
          var x = width / 15
          var y = 50 + i * heightCase
          return 'translate(' + x + ',' + y + ')'
        })
  
    legend.append('rect')
      .attr('width', width / 125)
      .attr('height', height / 50)
      .style('fill', d =>  color(d))
      .style('stroke', color)
  
    legend.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text(d => d)
  }

/**
 * Détermine le domain d'un objet color via les données qu'on lui transmets (normalement les données qui seront utilisées en appelant cet objet Color)
 *
 * @param color       L'objet représentant les couleurs (la range ayant déjà été définie)
 * @param data        Données à qui l'on souhaite lier une couleur
 */
function domainColor(color, data) {
    var sects = Object.keys(data)
    color.domain(sects)
}
  
/**
 * Détermine le domain des échelles via les données qu'on lui transmets
 *
 * @param xFocus        Echelle de l'axe x pour un LineChart
 * @param yFocus        Echelle de l'axe y pour un LineChart
 * @param data          Données qu'on souhaite liéer aux échelles.
 */
function setDomains(xFocus, yFocus, data) {
    
    var dateMin = d3.min(Object.values(data).map(d => d3.min(d.map(elem => elem.date))))
    var dateMax = d3.max(Object.values(data).map(d => d3.max(d.map(elem => elem.date))))
    var countMax = d3.max(Object.values(data).map(d => d3.max(d.map(elem => elem.count))))

    xFocus.domain([dateMin, dateMax])
    yFocus.domain([0, countMax])
}

/**
 * Lie les axes x et y à un LineChart
 *
 * @param focus         Groupe d'un LineChart
 * @param height        Hauteur du groupe
 * @param xAxis         Axe x pour le LineChart
 * @param yAxis         Axe y pour le LineChart
 */
function setAxes(focus, height, xAxis, yAxis) {
  focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)

  focus.append("g")
    .attr("class", "y axis")
    .call(yAxis)  
}

// La fonction de recherche a été enlevée par rapport à la maquette
// les brushs aussi car il y avait un bug et je voulais au moins avoir une logique bien implémentée
// c'est pour cela qu'il y a des noms comportant "focus" pour reprendre une architecture semblable au TP utilisant le brush
function initHistos(groupPriv, groupPub, byDatePriv, byDatePub){

    // meme dimension pr les deux graphes
    var svgBars = d3.select("#svghistosPriv")
    var heightHisto = svgBars.attr("height")*0.5
    var widthHisto = svgBars.attr("width")*0.5

    var [xFocusPriv, yFocusPriv] = createLadders(widthHisto, heightHisto)
    var [xFocusPub, yFocusPub] = createLadders(widthHisto, heightHisto)

    setDomains(xFocusPriv, yFocusPriv, byDatePriv)
    setDomains(xFocusPub, yFocusPub, byDatePub)

    var [xAxisFocusPriv, yAxisFocusPriv] = createAxes(xFocusPriv, yFocusPriv)
    var [xAxisFocusPub, yAxisFocusPub] = createAxes(xFocusPub, yFocusPub)

    var focusPriv = createGroups(groupPriv, heightHisto)
    var focusPub = createGroups(groupPub, heightHisto)

    var lineFocusPriv = createLine(xFocusPriv, yFocusPriv)

    var lineFocusPub = createLine(xFocusPub, yFocusPub)

    var colorPriv = d3.scaleOrdinal(d3.schemeCategory10)
    var colorPub = d3.scaleOrdinal(d3.schemeCategory10)

    domainColor(colorPriv, byDatePriv)
    domainColor(colorPub, byDatePub)

    // Axes focus
  
    setAxes(focusPriv, heightHisto, xAxisFocusPriv, yAxisFocusPriv)
    setAxes(focusPub, heightHisto, xAxisFocusPub, yAxisFocusPub)

    createFocusLineChart(groupPriv, byDatePriv, lineFocusPriv, colorPriv)
    createFocusLineChart(groupPub, byDatePub, lineFocusPub, colorPub)
    
    /***** Création de la légende *****/
    legend(groupPriv, heightHisto / 2, widthHisto / 2, byDatePriv, colorPriv)
    legend(groupPub, heightHisto / 2, widthHisto / 2, byDatePub, colorPub)
}
