"use strict";

// TODO: ajuster les couleurs, de preference en gardant les couleurs deja attribuées au niveau du sankey

/**
 * Fonction qui compte le nombre de rapports pour un acteur privé
 *
 * @param dictPriv                  Sous dictionnaire à 2 étages du dictionnaire général possédant les comptes pour un acteur privé
 * @return {int}                    Retourne le nombre de rapport pour cet acteur privé
 */
function countSinglePriv(dictPriv) {
    return d3.sum(Object.keys(dictPriv).map(typePub => 
        d3.sum(Object.keys(dictPriv[typePub]).map(actor => dictPriv[typePub][actor]))
   ))
}

/**
 * Fonction qui compte le nombre de rapports pour un les acteurs privés d'un secteur
 *
 * @param dictSect                  Sous dictionnaire à 3 étages du dictionnaire général possédant les comptes pour un secteur privé
 * @return {list}                   Retourne une liste comptant pour les acteurs privés d'un secteur leurs nombres de rapports
 */
function countByPriv(dictSect) {
    return Object.keys(dictSect).map(priv => ({
        name: priv,
        count: countSinglePriv(dictSect[priv])
    }))
}

/**
 * Fonction qui compte le nombre de rapports pour les secteurs privés
 *
 * @param dict                      Dictionnaire général
 * @return {list}                   Retourne une liste comptant pour les secteurs privés leurs nombres de rapports
 */
function countBySect(dict) {
    return Object.keys(dict).map(sect => ({
        name: sect,
        count: d3.sum(countByPriv(dict[sect]).map(priv => priv.count))
    }))
}

/**
 * Fonction qui compte le nombre de rapports pour un secteur public
 *
 * @param dict                      Dictionnaire général
 * @return {dict}                   Retourne un dictionnaire de forme type acteur public -> acteur public -> nombre de rapports pour cet acteur
 */
function countByActor(dict) {
    var byPubType = {}
    Object.keys(dict).forEach(sect => {
        Object.keys(dict[sect]).forEach(priv => {
            Object.keys(dict[sect][priv]).forEach(typePub => {
                Object.keys(dict[sect][priv][typePub]).forEach(pub => {
                    var byTypePubEntry = byPubType[typePub]
                    if (typeof byTypePubEntry === 'undefined') {
                        byPubType[typePub] = {}
                        byPubType[typePub][pub] = {
                            name: pub,
                            count: dict[sect][priv][typePub][pub]
                        }
                    } else {
                        var byAactorEntry = byTypePubEntry[pub]
                        if (typeof byAactorEntry === 'undefined') {
                            byTypePubEntry[pub] = {
                                name: pub,
                                count: dict[sect][priv][typePub][pub]
                            }
                        } else {
                            byPubType[typePub][pub].count += dict[sect][priv][typePub][pub]
                        }
                    }
                })
            })
        })
    })

    return byPubType
}

/**
 * Fonction qui compte le nombre de rapports pour les secteurs publics
 *
 * @param dict                      Dictionnaire général
 * @return {list}                   Retourne une liste qui pour chaque type d'acteur public compte son nombre de rapports
 */
function countByTypePub(dict) {
    var byType = {}

    var countBySingleTypePub = (dictType) => d3.sum(Object.keys(dictType).map(pub => dictType[pub]))

    Object.keys(dict).forEach(sect => {
        Object.keys(dict[sect]).forEach(priv => {
            Object.keys(dict[sect][priv]).forEach(typePub => {
                var byTypeEntry = byType[typePub]
                var value = countBySingleTypePub(dict[sect][priv][typePub])
                if (typeof byTypeEntry === 'undefined') {
                    byType[typePub] = {
                        name: typePub,
                        count: value
                    }
                } else {
                    byType[typePub].count += value
                }
            })
        })
    })

    return Object.values(byType)
}

/**
 * Fonction qui compte le nombre de rapports pour chaque province d'ou viennent les acteurs privés
 *
 * @param dict                      Dictionnaire général
 * @param privates                  Data représentant les acteurs privés
 * @return {list}                   Retourne une liste qui pour chaque province compte son nombre de rapports
 */

function countByProv(dict, privates) {
    var byProv = {}
    Object.keys(dict).forEach(sect => {
        Object.keys(dict[sect]).forEach(priv => {
            var prov = privates[priv].province
            var provEntry = byProv[prov]
            var countPriv = countSinglePriv(dict[sect][priv])
            if (typeof provEntry === 'undefined') {
                byProv[prov] = {
                    province: prov,
                    count: countPriv
                }
            } else {
                provEntry.count += countPriv
            }
        })
    })
    return Object.values(byProv)
}

function createAxesLadders(data, height, width, funX) {
    var x = d3.scaleBand().range([0, width])
    var y = d3.scaleLinear().range([height, 0])
    x.domain(data.map(funX))
    y.domain([0, d3.max(data.map(d => d.count))])

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y)

    return [x, y, xAxis, yAxis]
}

function drawBars(barsGroup, data, x, y, xAxis, yAxis, height, funX) {

    barsGroup.selectAll("*").remove()

    barsGroup.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform","translate(0,0)rotate(45)")
  
    barsGroup.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      
  
    barsGroup.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "rect")
        .style("fill", "steelblue")
        .attr("x", d => x(funX(d)))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count))
}

function setOnclick(barsGroup, height, width, funCount) {
    barsGroup.selectAll(".rect")
        .on("click", d => {
            var countByX = funCount(d.name)
            var [x, y, xAxis, yAxis] = createAxesLadders(countByX, height, width, d => d.name)
            drawBars(barsGroup, countByX, x, y, xAxis, yAxis, height, d => d.name)
        })
}

/**
 * Fonction qui permet de setter le comportement des boutons pour passer de l'affichage selon les acteurs publics ou privés
 *
 * @param funPriv                 Fonction pour afficher le bar chart selon la partie des acteurs publics
 * @param funPub                  Fonction pour afficher le bar chart selon la partie des acteurs privés
 */
function setMode(funPriv, funPub) {
    d3.select("#public").on("click", () => funPub())
    d3.select("#private").on("click", () => funPriv())
}


// Les bar charts on comme pour le Sankey un principe de zoom, ce dernier est plus simple puisqu'il ne necessite pas de partager un état entre les différentes interactions
function initBars(barsGroup, barProvinceGroup, dict, privates) {
    
    var funPriv = () => {
        var dataBySect = countBySect(dict)

        var svgBars = d3.select("#svgbarCharts")
        var heightBars = svgBars.attr("height")*0.5
        var widthBars = svgBars.attr("width")*0.5

        var [x, y, xAxis, yAxis] = createAxesLadders(dataBySect, heightBars, widthBars, d => d.name)

        drawBars(barsGroup, dataBySect, x, y, xAxis, yAxis, heightBars, d => d.name)
        setOnclick(barsGroup, heightBars, widthBars, name => countByPriv(dict[name]))
    }
    funPriv()


    var funPub = () => {
        var dataByTypePub = countByTypePub(dict)

        var svgBars = d3.select("#svgbarCharts")
        var heightBars = svgBars.attr("height")*0.5
        var widthBars = svgBars.attr("width")*0.5

        var [x, y, xAxis, yAxis] = createAxesLadders(dataByTypePub, heightBars, widthBars, d => d.name)
        drawBars(barsGroup, dataByTypePub, x, y, xAxis, yAxis, heightBars, d => d.name)
        var dictByActor = countByActor(dict)
        setOnclick(barsGroup, heightBars, widthBars, name => Object.values(dictByActor[name]))
    }

    setMode(funPriv, funPub)

    var svgBarProvince = d3.select("#svgbarProvince")
    var heightProv = svgBarProvince.attr("height")*0.5
    var widthProv = svgBarProvince.attr("width")*0.5

    var dataByProv = countByProv(dict, privates) 
    var [xPro, yPro, xAxisPro, yAxisPro] = createAxesLadders(dataByProv, heightProv, widthProv, (d => d.province))
    drawBars(barProvinceGroup, dataByProv, xPro, yPro, xAxisPro, yAxisPro, heightProv, d => d.province)

}
