//--------------------------------------------------------------------
// path - stores a number of segments
//--------------------------------------------------------------------
function Path() {
    this.kind = 1;                  // Path kind
    this.segments = Array();        // Segments
    this.sel;                       // Selected object info
    this.intarr = Array();          // Intersection list (one list per segment)
    this.tmplist = Array();         // Temporary list for testing of intersections
    this.auxlist = Array();         // Auxillary temp list for testing of intersections
    this.fillColor = "#48B";        // Fill color (default is blueish)
    this.strokeColor = "#246";      // Stroke color (default is dark blue)
    this.Opacity = 0.5;             // Opacity (default is 50%)
    this.linewidth = 3;             // Line Width (stroke width - default is 3 pixels)
    this.isorganized = true;        // This is true if segments are organized e.g. can be filled using a single command since segments follow a path 1,2-2,5-5,9 etc
                                    // An organized path can contain several sub-path, each of which must be organized

    //--------------------------------------------------------------------
    // move
    // Performs a delta-move on all points in a path
    //--------------------------------------------------------------------
    this.move = function(movex, movey) {
        for (var i = 0; i < this.segments.length; i++) {
            var seg = this.segments[i];
            points[seg.pa].x += movex;
            points[seg.pa].y += movey;
            points[seg.pb].x += movex;
            points[seg.pb].y += movey;
        }
    }

    //--------------------------------------------------------------------
    // addsegment
    // Adds a segment to a path
    //--------------------------------------------------------------------
    this.addsegment = function(kind, p1, p2, p3, p4, p5, p6, p7, p8) {
        // Line segment (only kind of segment at the moment)
        if (kind == 1) {
            // Only push segment if it does not already exist
            if (!this.existsline(p1, p2, this.segments)) {
                this.segments.push({kind:1, pa:p1, pb:p2});
            }
        } else {
            alert("Unknown segment type: " + kind);
        }
    }

    //--------------------------------------------------------------------
    // addsegment
    // Draws filled path to screen (or svg when that functionality is added)
    //--------------------------------------------------------------------
    this.draw = function (fillstate, strokestate) {
        if (this.isorganized == false) {
            alert("Only organized paths can be filled!");
        }
        if (this.segments.length > 0) {
            // Assign stroke style, color, transparency etc
            ctx.strokeStyle = this.strokeColor;
            ctx.fillStyle = this.fillColor;
            ctx.globalAlpha = this.Opacity;
            ctx.lineWidth = this.linewidth;
            ctx.beginPath();
            var pseg = this.segments[0];
            ctx.moveTo(points[pseg.pa].x, points[pseg.pa].y);
            for (var i = 0; i < this.segments.length; i++) {
                var seg = this.segments[i];
                // If we start over on another sub-path, we must start with a moveto
                if (seg.pa != pseg.pb) {
                    ctx.moveTo(points[seg.pa].x, points[seg.pa].y);
                }
                // Draw current line
                ctx.lineTo(points[seg.pb].x, points[seg.pb].y);
                // Remember previous segment
                pseg = seg;
            }
            // Make either stroke or fill or both -- stroke always after fill
            if (fillstate) {
                ctx.fill();
            }
            if (strokestate) {
                ctx.stroke();
            }
            // Reset opacity so that following draw operations are unaffected
            ctx.globalAlpha = 1.0;
        }
    }

    //--------------------------------------------------------------------
    // inside
    // Returns true if coordinate xk, yk falls inside the bounding box of the symbol
    //--------------------------------------------------------------------
    this.inside = function (xk, yk) {
        // Count Crossing linear segments
        var crosses = 0;
        // Check against segment list
        for (var i = 0; i < this.segments.length; i++) {
            var item = this.segments[i];
            var pax = points[item.pa].x;
            var pbx = points[item.pb].x;
            var pay = points[item.pa].y;
            var pby = points[item.pb].y;
            var dx = pbx - pax;
            var dy = pby - pay;
            var dd = dx / dy;
            // Returning working cross even if line goes top to bottom
            if (pby < pay) {
                if (yk > pby && yk < pay && ((((yk - pay) * dd) + pax) < xk)) {
                    crosses++;
                }
            } else {
                if (yk > pay && yk < pby && ((((yk - pay) * dd) + pax) < xk)) {
                    crosses++;
                }
            }
        }
        // Add one to reverse truth value e.g. 0 if 1 etc
        return (crosses + 1) % 2;
    }

    //--------------------------------------------------------------------
    // recursetest
    // Recursively splits a line at intersection points from top to bottom until there is no line left
    //--------------------------------------------------------------------
    this.recursetest = function(p1,p2) {
        var yk = 5000;
        var endres = null;
        for (var i = 0; i < this.segments.length; i++) {
            var item = this.segments[i];
            var result = this.intersection(p1, p2, item.pa, item.pb);
            if (result.state == true && result.y < yk) {
                yk = result.y;
                endres = result;
            }
        }
        if (yk != 5000) {
            // Create new point (if it does not already exist)
            pointno = points.length
            points.push({x:endres.x, y:endres.y});
            // Depending on direction of p1 and p2
            if (points[p2].y < points[p1].y) {
                this.tmplist.push({kind:1, pa:pointno, pb:p2});
                this.recursetest(pointno, p1);
            } else {
                this.tmplist.push({kind:1, pa:pointno, pb:p1});
                this.recursetest(pointno, p2);
            }
        } else {
            this.tmplist.push({kind:1, pa:p1, pb:p2});
        }
    }

    //--------------------------------------------------------------------
    // intersection
    // Line to line intersection
    // Does not detect intersections on end points (we do not want end points to be part of intersection set)
    //--------------------------------------------------------------------
    this.intersection = function(p1, p2, p3, p4) {
        var x1 = points[p1].x;
        var y1 = points[p1].y;
        var x2 = points[p2].x;
        var y2 = points[p2].y;
        var x3 = points[p3].x;
        var y3 = points[p3].y;
        var x4 = points[p4].x;
        var y4 = points[p4].y;
        // Basic fix for straight lines
        if (x1 == x2) {
            x2 += 0.01;
        }
        if (y1 == y2) {
            y2 += 0.01;
        }
        if (x3 == x4) {
            x4 += 0.01;
        }
        if (y3 == y4) {
            y4 += 0.01;
        }
        var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
        var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
        if (isNaN(x) || isNaN(y)) {
            return {state:false, x:0, y:0};
        } else {
            if (x1 >= x2) {
                if (!(x2 < x && x < x1)) {
                    return {state:false, x:0, y:0};
                }
            } else {
                if (!(x1 < x && x < x2)) {
                    return {state:false, x:0, y:0};
                }
            }
            if (y1 >= y2) {
                if (!(y2 < y && y < y1)) {
                    return {state:false, x:0, y:0};
                }
            } else {
                if (!(y1 < y && y < y2)) {
                    return {state:false, x:0, y:0};
                }
            }
            if (x3 >= x4) {
                if (!(x4 < x && x < x3)) {
                    return {state:false, x:0, y:0};
                }
            } else {
                if (!(x3 < x && x < x4)) {
                    return {state:false, x:0, y:0};
                }
            }
            if (y3 >= y4) {
                if (!(y4 < y && y < y3)) {
                    return {state:false, x:0, y:0};
                }
            } else {
                if (!(y3 < y && y < y4)) {
                    return {state:false, x:0, y:0};
                }
            }
        }
        return {state:true, x:x, y:y};
    }

    //--------------------------------------------------------------------
    // existsline
    // Checks if a line already exists but in the reverse direction
    // Only checks lines, not bezier curves
    //--------------------------------------------------------------------
    this.existsline = function (p1, p2, segmentset) {
        if (p1 == p2) {
            return true;
        }
        for (var i = 0; i < segmentset.length; i++) {
            var segment = segmentset[i];
            if ((segment.pa == p1 && segment.pb == p2) ||
                (segment.pa == p2 && segment.pb == p1)) {
                return true;
            }
        }
        return false;
    }

    //--------------------------------------------------------------------
    // recursetest
    // Line to line intersection
    // Does not detect intersections on end points (we do not want end points to be part of intersection set)
    //--------------------------------------------------------------------
    this.boolOp = function (otherpath) {
        // Clear temporary lists used for merging paths
        this.tmplist = [];
        this.auxlist = [];
        otherpath.tmplist = [];
        otherpath.auxlist = [];
        // Recurse local segment set and check for crossing lines
        for (var i = 0; i < otherpath.segments.length; i++) {
            this.recursetest(otherpath.segments[i].pa, otherpath.segments[i].pb);
        }
        // Check if each segment is inside the joining set
        for (var i = 0; i < this.tmplist.length; i++) {
            var item = this.tmplist[i];
            // Check if center of line is inside or outside
            var p1 = points[item.pa];
            var p2 = points[item.pb];
            var xk = (p1.x + p2.x) * 0.5;
            var yk = (p1.y + p2.y) * 0.5;
            if (this.inside(xk, yk, otherpath)) {
                if (!this.existsline(item.pa, item.pb, this.auxlist)) {
                    this.auxlist.push(item);
                }
            }
        }
        // Recurse into joining segment set and check for crossing lines
        for (var i = 0; i < this.segments.length; i++) {
            var item = this.segments[i];
            otherpath.recursetest(item.pa, item.pb);
        }
        // Check if each segment is inside the local set
        for (var i = 0; i < otherpath.tmplist.length; i++) {
            var item = otherpath.tmplist[i];
            // Check if center of line is inside or outside
            var p1 = points[item.pa];
            var p2 = points[item.pb];
            var xk = (p1.x + p2.x) * 0.5;
            var yk = (p1.y + p2.y) * 0.5;
            if (otherpath.inside(xk, yk, this)) {
                if (!this.existsline(item.pa, item.pb, this.auxlist)) {
                    this.auxlist.push(item);
                }
            }
        }
        alert(this.auxlist.length);
        this.drawsegments(this.auxlist);
    }

    //--------------------------------------------------------------------
    // drawsegments
    // Debug drawing of a segment set (for example for drawing tmplist, auxlist etc)
    //--------------------------------------------------------------------
    this.drawsegments = function (segmentlist, color) {
        // Draw aux set
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#46f";
        for (var i = 0; i < segmentlist.length; i++) {
            var line = segmentlist[i];
            // If line is a straight line
            if (line.kind == 1) {
                ctx.beginPath();
                ctx.moveTo(points[line.pa].x, points[line.pa].y);
                ctx.lineTo(points[line.pb].x, points[line.pb].y);
                ctx.stroke();
            }
        }
    }

    this.erase = function() {
        for (i = 0; i < this.segments.length; i++) {
            points[this.segments[i].pa] = waldoPoint;
            points[this.segments[i].pb] = waldoPoint;
        }
    }
}

function drawSegment(pathA, p1, p2) {
    pathA.addsegment(1, p1, p2);
    return pathA;
}

var figurePath = new Path();
var isFirstPoint = true;
var startPosition;
var numberOfPointsInFigure = 0;

function createFigure() {
    if (uimode == "CreateFigure" && md == 4) {
        if (figureMode == "Free") {
            figureFreeDraw();
        } else if (figureMode == "Square") {
            figureSquare();
        }
    }
}

/**
 * Free draw, the user have to click for
 * every point to draw on the canvas.
 */
function figureFreeDraw() {
    p1 = null;
    if (isFirstPoint) {
        p2 = points.addpoint(cx, cy, false);
        startPosition = p2;
        isFirstPoint = false;
    } else {
        // Read and set the values for p1 and p2
        p1 = p2;
        if (activePoint != null) {
            p2 = activePoint;
        } else {
            p2 = points.addpoint(cx, cy, false);
        }
        // Check if the new point is the starting point
        if (points[startPosition].x == points[p2].x &&
            points[startPosition].y == points[p2].y) {
            // Delete all previous rendered lines
            for (var i = 0; i < numberOfPointsInFigure; i++) {
                diagram.pop();
            }
            // Render the figure
            figurePath.addsegment(1, p1, p2);
            diagram.push(figurePath);
            cleanUp();
        } else {
            // Temporary store the new line and then render it
            var tempPath = new Path;
            tempPath.addsegment(1, p1, p2);
            diagram.push(tempPath);
            // Save the new line to the figure
            figurePath.addsegment(1, p1, p2);
            numberOfPointsInFigure++;
        }
    }
}

/**
 * Draws a square between p1 and p2.
 */
function figureSquare() {
    if (isFirstPoint) {
        p1 = points.addpoint(cx, cy, false);
        isFirstPoint = false;
    } else {
        p3 = points.addpoint(cx, cy, false);
        p2 = points.addpoint(points[p1].x, points[p3].y, false);
        p4 = points.addpoint(points[p3].x, points[p1].y, false);
        figurePath.addsegment(1, p1, p2);
        figurePath.addsegment(1, p2, p3);
        figurePath.addsegment(1, p3, p4);
        figurePath.addsegment(1, p4, p1);
        diagram.push(figurePath);
        cleanUp();
    }
}

/**
 * Resets all varables to ther default start value.
 */
function cleanUp() {
    figurePath = new Path;
    startPosition = null;
    uimode = null;
    figureMode = null;
    isFirstPoint = true;
    numberOfPointsInFigure = 0;
    resetSelectionCreateFigure();
}