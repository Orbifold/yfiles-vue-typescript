import {
  CollapsibleNodeStyleDecoratorRenderer,
  CreateEdgeInputMode,
  DropInputMode,
  Font,
  GeneralPath,
  GraphComponent,
  ILassoTestable,
  INodeInsetsProvider,
  INodeSizeConstraintProvider,
  Insets,
  MoveInputMode,
  NodeSizeConstraintProvider,
  NodeStyleBase,
  Rect,
  Size,
  SvgVisual,
  TextRenderSupport,
  TextWrapping,
} from "yfiles";

import * as _ from "lodash";

const SVG_NS = "http://www.w3.org/2000/svg";
const BORDER_THICKNESS = 4;
// Due to a strange bug in Safari 10.8, calculating this in place as "2 * BORDER_THICKNESS" results in undefined
// Therefore, keep this constant for now.
const BORDER_THICKNESS2 = BORDER_THICKNESS + BORDER_THICKNESS;
const HEADER_THICKNESS = 22;
const COLLAPSED_WIDTH = 120;
const COLLAPSED_HEIGHT = 80;

export class GroupStyle extends NodeStyleBase {
  cssClass: string;
  isCollapsible: boolean;
  solidHitTest: boolean;

  $folderFrontColor: string;
  $folderBackColor: string;
  font: Font;

  constructor() {
    super();
    this.cssClass = "";
    this.isCollapsible = false;
    this.solidHitTest = false;

    this.$folderFrontColor = "#a0a0a0";
    this.$folderBackColor = "#626262";
    this.font = new Font({
      fontFamily: "Arial",
      fontSize: 12,
      lineSpacing: 0.2,
    });
  }

  getBorderColor(node) {
    return "#323232";

    // const typeName = _.isString(node.tag) ? node.tag : node.tag.typeName;
    // switch (typeName) {
    // 	// from dark to light
    // 	case NodeType.ProgramGroup:
    // 	case NodeType.InfoProdGroup:
    // 		return "#484848";
    // 	case NodeType.InitiativeGroup:
    // 	case NodeType.IpSectionGroup:
    // 		return "#686868";
    // 	case NodeType.SolutionGroup:
    // 	case NodeType.IpSubSectionGroup:
    // 		return "#888888";
    // 	case NodeType.ArtifactGroup:
    // 	case NodeType.CategoryGroup:
    // 		return "#aaaaaa";
    // }
  }

  /**
   * Creates the visual for a collapsed or expanded group node.
   * @return {SvgVisual}
   */
  createVisual(renderContext, node) {
    const gc = renderContext.canvasComponent;
    const layout = node.layout;
    const container = document.createElementNS(SVG_NS, "g");
    // avoid defs support recursion - nothing to see here - move along!
    container.setAttribute("data-referencesafe", "true");
    if (this.isCollapsed(node, gc)) {
      this.$renderFolder(node, container, renderContext);
    } else {
      this.$renderGroup(node, container, renderContext);
    }
    container.setAttribute(
      "transform",
      "translate(" + layout.x + " " + layout.y + ")"
    );
    return new SvgVisual(container);
  }

  /**
   * Re-renders the group node by updating the old visual for improved performance.
   */
  updateVisual(renderContext, oldVisual, node) {
    const container = oldVisual.svgElement;
    const cache = container["data-renderDataCache"];
    if (!cache) {
      return this.createVisual(renderContext, node);
    }
    if (this.isCollapsed(node, renderContext.canvasComponent)) {
      this.$updateFolder(node, container, renderContext);
    } else {
      this.$updateGroup(node, container, renderContext);
    }
    return oldVisual;
  }

  /**
   * Helper function to create a collapsed group node visual inside the given container.
   * @private
   */
  private $renderFolder(node, container, ctx) {
    const layout = node.layout;
    const width = layout.width;
    const height = layout.height;

    const backgroundRect = document.createElementNS(SVG_NS, "rect");
    backgroundRect.setAttribute("fill", this.$folderBackColor);
    backgroundRect.setAttribute("stroke", "#FFF");
    backgroundRect.setAttribute("stroke-width", "1px");
    backgroundRect.setAttribute("rx", "5");
    backgroundRect.setAttribute("ry", "5");
    backgroundRect.setAttribute("id", "background");
    backgroundRect.width.baseVal.value = width;
    backgroundRect.height.baseVal.value = height;

    // const path =
    //   "M " +
    //   (width - 0.5) +
    //   ",2 l -25,0 q -2,0 -4,3.75 l -4,7.5 q -2,3.75 -4,3.75 L 0.5,17 L 0.5," +
    //   (height - 0.5) +
    //   " l " +
    //   (width - 1) +
    //   ",0 Z";
    //
    // const folderPath = document.createElementNS(SVG_NS, "path");
    // folderPath.setAttribute("d", path);
    // folderPath.setAttribute("fill", this.$folderFrontColor);
    // container.appendChild(folderPath);

    container.appendChild(backgroundRect);

    const expandButton = this.$createButton(false);
    CollapsibleNodeStyleDecoratorRenderer.addToggleExpansionStateCommand(
      expandButton,
      node,
      ctx
    );
    expandButton.svgElement.setAttribute(
      "transform",
      "translate(" + (width - 17) + " 5)"
    );
    container.appendChild(expandButton.svgElement);

    const text = window.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    text.textContent = _.isString(node.tag) ? "Group" : node.tag.name;
    text.setAttribute("font-size", "12px");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("line-spacing", "0.2");
    text.setAttribute("fill", "white");
    const size = new Size(node.layout.width - 5, node.layout.height - 15);
    const textContent = TextRenderSupport.addText(
      text,
      text.textContent,
      this.font,
      size,
      TextWrapping.WORD_ELLIPSIS
    );

    // calculate the size of the text element
    const textSize = TextRenderSupport.measureText(
      textContent,
      this.font,
      null,
      TextWrapping.WORD
    );

    // if edit button is visible align left, otherwise center
    const translateX = (node.layout.width - textSize.width) * 0.5;

    // calculate vertical offset for centered alignment
    const translateY = 10 + (node.layout.height - textSize.height) * 0.5;

    text.setAttribute("transform", `translate(${translateX} ${translateY})`);

    container.appendChild(text);

    if (this.cssClass) {
      container.setAttribute("class", this.cssClass + "-collapsed");
      backgroundRect.setAttribute("class", "folder-background");
      // folderPath.setAttribute("class", "folder-foreground");
    }

    container["data-renderDataCache"] = {
      isCollapsible: this.isCollapsible,
      collapsed: true,
      width: width,
      height: height,
      x: layout.x,
      y: layout.y,
    };
  }

  /**
   * Helper function to update the visual of a collapsed group node.
   */
  private $updateFolder(node, container, ctx) {
    const cache = container["data-renderDataCache"];

    if (!cache || this.isCollapsible !== cache.isCollapsible) {
      this.$renderFolder(node, container, ctx);
      return;
    }

    const width = node.layout.width;
    const height = node.layout.height;
    let path, backgroundRect, folderPath;
    // remove the tex
    const text = container.childNodes.item(2);

    if (!cache.collapsed) {
      // transition from expanded state
      // path =
      //   "M " +
      //   (width - 0.5) +
      //   ",2 l -25,0 q -2,0 -4,3.75 l -4,7.5 q -2,3.75 -4,3.75 L 0.5,17 L 0.5," +
      //   (height - 0.5) +
      //   " l " +
      //   (width - 1) +
      //   ",0 Z";

      backgroundRect = container.childNodes.item(0);
      backgroundRect.setAttribute("fill", this.$folderBackColor);
      backgroundRect.setAttribute("stroke", "#FFF");
      backgroundRect.setAttribute("stroke-width", "1px");
      backgroundRect.setAttribute("rx", "5");
      backgroundRect.setAttribute("ry", "5");

      // folderPath = document.createElementNS(SVG_NS, "path");
      // folderPath.setAttribute("d", path);
      // folderPath.setAttribute("fill", this.$folderFrontColor);
      //
      // container.replaceChild(folderPath, container.childNodes.item(1));
      const innerRect = container.childNodes.item(1);
      innerRect.setAttribute("width", 0);
      // - to +
      const buttonGroup = container.childNodes.item(3);

      const minus = buttonGroup.childNodes.item(1);
      const vMinus = document.createElementNS(SVG_NS, "rect");
      vMinus.setAttribute("width", "2");
      vMinus.setAttribute("height", "8");
      vMinus.setAttribute("x", "5");
      vMinus.setAttribute("y", "2");
      vMinus.setAttribute("fill", this.$folderBackColor);
      vMinus.setAttribute("stroke-width", "0"); // we don't want a stroke here, even if it is set in the corresponding
      // css class

      if (this.cssClass) {
        container.setAttribute("class", this.cssClass + "-collapsed");
        backgroundRect.setAttribute("class", "folder-background");
        // folderPath.setAttribute("class", "folder-foreground");
        minus.setAttribute("class", "folder-foreground");
        vMinus.setAttribute("class", "folder-foreground");
      }

      buttonGroup.appendChild(vMinus);

      cache.collapsed = true;
    }

    // update old visual
    if (cache.width !== width || cache.height !== height) {
      backgroundRect = container.childNodes.item(0);
      backgroundRect.width.baseVal.value = width;
      backgroundRect.height.baseVal.value = height;

      // path =
      //   "M " +
      //   (width - 0.5) +
      //   ",2 l -25,0 q -2,0 -4,3.75 l -4,7.5 q -2,3.75 -4,3.75 L 0.5,17 L 0.5," +
      //   (height - 0.5) +
      //   " l " +
      //   (width - 1) +
      //   ",0 Z";
      // folderPath = container.childNodes.item(1);
      // folderPath.setAttribute("d", path);

      const expandButton = this.getExpandButton(container.childNodes);
      expandButton.transform.baseVal.getItem(0).setTranslate(width - 17, 5);
      const size = new Size(node.layout.width - 15, node.layout.height - 20);
      // calculate the size of the text element
      const textContent = TextRenderSupport.addText(
        text,
        node.tag.name,
        this.font,
        size,
        TextWrapping.WORD_ELLIPSIS
      );

      // calculate the size of the text element
      const textSize = TextRenderSupport.measureText(
        textContent,
        this.font,
        size,
        TextWrapping.WORD
      );
      // if edit button is visible align left, otherwise center
      const translateX = (width - 2 - textSize.width) * 0.5;

      // calculate vertical offset for centered alignment
      const translateY = 10 + (height - textSize.height) * 0.5;

      text.setAttribute("transform", `translate(${translateX} ${translateY})`);

      cache.width = width;
      cache.height = height;
    }

    const x = node.layout.x;
    const y = node.layout.y;
    if (cache.x !== x || cache.y !== y) {
      container.transform.baseVal.getItem(0).setTranslate(x, y);
      cache.x = x;
      cache.y = y;
    }
  }

  private getExpandButton(childNodes: NodeListOf<ChildNode>) {
    let found = null;
    childNodes.forEach((child) => {
      if (child.nodeName === "g") {
        found = child;
        return;
      }
    });
    return found;
  }

  /**
   * Helper function to create an expanded group node visual inside the given container.
   */
  private $renderGroup(node, container, ctx) {
    const layout = node.layout;
    const width = layout.width;
    const height = layout.height;

    const outerRect = document.createElementNS(SVG_NS, "rect");
    outerRect.setAttribute("fill", this.getBorderColor(node));
    outerRect.setAttribute("stroke", "white");
    outerRect.setAttribute("stroke-width", "1px");
    outerRect.setAttribute("rx", "5");
    outerRect.setAttribute("ry", "5");
    outerRect.width.baseVal.value = width;
    outerRect.height.baseVal.value = height;

    const innerRect = document.createElementNS(SVG_NS, "rect");
    const innerWidth = width - BORDER_THICKNESS2;
    const headerHeight = HEADER_THICKNESS;
    const innerHeight = height - headerHeight - BORDER_THICKNESS;

    innerRect.setAttribute("fill", "#FFF");
    innerRect.x.baseVal.value = BORDER_THICKNESS;
    innerRect.y.baseVal.value = headerHeight;
    innerRect.width.baseVal.value = innerWidth;
    innerRect.height.baseVal.value = innerHeight;

    container.appendChild(outerRect);
    container.appendChild(innerRect);

    const text = window.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

    const size = new Size(node.layout.width - 20, 20);
    // calculate the size of the text element
    const textContent = TextRenderSupport.addText(
      text,
      _.isString(node.tag) ? "Group" : node.tag.name,
      this.font,
      size,
      TextWrapping.WORD_ELLIPSIS
    );
    text.setAttribute("transform", "translate(5 3)");
    text.setAttribute("font-size", "12px");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("line-spacing", "0.2");
    text.setAttribute("fill", "white");
    container.appendChild(text);

    if (this.isCollapsible) {
      const collapseButton = this.$createButton(true);
      CollapsibleNodeStyleDecoratorRenderer.addToggleExpansionStateCommand(
        collapseButton,
        node,
        ctx
      );
      collapseButton.svgElement.setAttribute(
        "transform",
        "translate(" + (width - 17) + " 5)"
      );
      container.appendChild(collapseButton.svgElement);
    }

    if (this.cssClass) {
      container.setAttribute("class", this.cssClass + "-expanded");
      outerRect.setAttribute("class", "group-border");
    }

    container["data-renderDataCache"] = {
      isCollapsible: this.isCollapsible,
      collapsed: false,
      width: width,
      x: layout.x,
      y: layout.y,
      height: height,
    };
  }

  /**
   * Helper function to update the visual of an expanded group node.
   */
  private $updateGroup(node, container, ctx) {
    const cache = container["data-renderDataCache"];
    if (!cache || this.isCollapsible !== cache.isCollapsible) {
      this.$renderGroup(node, container, ctx);
      return;
    }

    const width = node.layout.width;
    const height = node.layout.height;
    let backgroundRect = null;
    let innerRect = null;
    let innerWidth = null;
    let innerHeight = null;
    let headerHeight = null;

    if (cache.collapsed) {
      // transition from collapsed state
      backgroundRect = container.childNodes.item(0);
      backgroundRect.setAttribute("fill", this.getBorderColor(node));

      innerRect = document.createElementNS(SVG_NS, "rect");
      innerWidth = width - BORDER_THICKNESS2;
      headerHeight = HEADER_THICKNESS;
      innerHeight = height - headerHeight - BORDER_THICKNESS;
      innerRect.setAttribute("fill", "#FFF");

      innerRect.x.baseVal.value = BORDER_THICKNESS;
      innerRect.y.baseVal.value = headerHeight;
      innerRect.width.baseVal.value = innerWidth;
      innerRect.height.baseVal.value = innerHeight;

      container.replaceChild(innerRect, container.childNodes.item(1));

      // + to -
      const buttonGroup = container.childNodes.item(2);
      buttonGroup.removeChild(buttonGroup.childNodes.item(2));

      if (this.cssClass) {
        container.setAttribute("class", this.cssClass + "-expanded");
        backgroundRect.setAttribute("class", "group-border");
        const minus = buttonGroup.childNodes.item(1);
        minus.setAttribute("class", "group-border");
      }

      cache.collapsed = false;
    }
    const text = container.childNodes.item(2);
    const size = new Size(node.layout.width - 20, 20);
    // calculate the size of the text element
    const textContent = TextRenderSupport.addText(
      text,
      _.isString(node.tag) ? "Group" : node.tag.name,
      this.font,
      size,
      TextWrapping.WORD_ELLIPSIS
    );
    text.setAttribute("transform", "translate(5 3)");

    // text.setAttribute('transform', 'translate(4 16)');
    // update old visual
    if (cache.width !== width || cache.height !== height) {
      backgroundRect = container.childNodes.item(0);
      backgroundRect.width.baseVal.value = width;
      backgroundRect.height.baseVal.value = height;

      innerWidth = width - BORDER_THICKNESS2;
      headerHeight = HEADER_THICKNESS;
      innerHeight = height - headerHeight - BORDER_THICKNESS;

      innerRect = container.childNodes.item(1);
      innerRect.width.baseVal.value = innerWidth;
      innerRect.height.baseVal.value = innerHeight;

      if (this.isCollapsible) {
        const expandButton = container.childNodes.item(3);
        expandButton.transform.baseVal.getItem(0).setTranslate(width - 17, 5);
      }

      cache.width = width;
      cache.height = height;
    }
    const x = node.layout.x;
    const y = node.layout.y;
    if (cache.x !== x || cache.y !== y) {
      container.transform.baseVal.getItem(0).setTranslate(x, y);
      cache.x = x;
      cache.y = y;
    }
  }

  /**
   * Helper function to create the collapse/expand button.
   */
  private $createButton(collapse) {
    const color = "grey";
    const container = document.createElementNS(SVG_NS, "g");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("fill", "#FFF");
    rect.setAttribute("width", "12");
    rect.setAttribute("height", "12");
    rect.setAttribute("rx", "1");
    rect.setAttribute("ry", "1");
    rect.setAttribute("id", "buttonBackground");

    const minus = document.createElementNS(SVG_NS, "rect");
    minus.setAttribute("width", "8");
    minus.setAttribute("height", "2");
    minus.setAttribute("x", "2");
    minus.setAttribute("y", "5");
    minus.setAttribute("fill", color);
    minus.setAttribute("stroke-width", "0"); // we don't want a stroke here, even if it is set in the corresponding css
    rect.setAttribute("id", "minus");
    // class

    container.appendChild(rect);
    container.appendChild(minus);

    if (this.cssClass) {
      minus.setAttribute(
        "class",
        collapse ? "group-border" : "folder-foreground"
      );
    }

    if (!collapse) {
      const vMinus = document.createElementNS(SVG_NS, "rect");
      vMinus.setAttribute("width", "2");
      vMinus.setAttribute("height", "8");
      vMinus.setAttribute("x", "5");
      vMinus.setAttribute("y", "2");
      vMinus.setAttribute("fill", color);
      vMinus.setAttribute("stroke-width", "0"); // we don't want a stroke here, even if it is set in the corresponding
      // css class

      container.appendChild(vMinus);

      if (this.cssClass) {
        vMinus.setAttribute("class", "folder-foreground");
      }
    }

    container.setAttribute("class", "demo-collapse-button");
    return new SvgVisual(container);
  }

  /**
   * Performs a lookup operation.
   */
  lookup(node, type): any {
    if (type === ILassoTestable.$class) {
      // @ts-ignore
      return new ILassoTestable((context, lassoPath) => {
        const path = new GeneralPath();
        const insetsProvider = node.lookup(INodeInsetsProvider.$class);
        if (insetsProvider) {
          const insets = insetsProvider.getInsets(node);
          const outerRect = node.layout.toRect();
          path.appendRectangle(outerRect, false);
          // check if its completely outside
          if (!lassoPath.areaIntersects(path, context.hitTestRadius)) {
            return false;
          }
          path.clear();
          const innerRect = outerRect.getReduced(insets);
          path.appendRectangle(innerRect, false);
          // now it's a hit if either the inner border is hit or one point of the border
          // itself is contained in the lasso
          return (
            lassoPath.intersects(path, context.hitTestRadius) ||
            lassoPath.areaContains(node.layout.topLeft)
          );
        } else {
          // no insets - we only check the center of the node.
          return lassoPath.areaContains(
            node.layout.center,
            context.hitTestRadius
          );
        }
      });
    } else if (type === INodeInsetsProvider.$class) {
      // @ts-ignore
      return new INodeInsetsProvider((node) => {
        const margin = 5;
        return new Insets(
          BORDER_THICKNESS + margin,
          HEADER_THICKNESS + margin,
          BORDER_THICKNESS + margin,
          BORDER_THICKNESS + margin
        );
      });
    } else if (type === INodeSizeConstraintProvider.$class) {
      return new NodeSizeConstraintProvider(
        new Size(40, 30),
        Size.INFINITE,
        Rect.EMPTY
      );
    }
    return super.lookup(node, type);
  }

  /**
   * Hit test which considers HitTestRadius specified in CanvasContext.
   */
  isHit(inputModeContext, p, node) {
    const layout = node.layout.toRect();
    if (
      this.solidHitTest ||
      this.isCollapsed(node, inputModeContext.canvasComponent)
    ) {
      return layout.containsWithEps(p, inputModeContext.hitTestRadius);
    } else {
      if (
        (CreateEdgeInputMode &&
          inputModeContext.parentInputMode instanceof CreateEdgeInputMode &&
          inputModeContext.parentInputMode.isCreationInProgress) ||
        (inputModeContext.parentInputMode instanceof MoveInputMode &&
          inputModeContext.parentInputMode.isDragging) ||
        inputModeContext.parentInputMode instanceof DropInputMode
      ) {
        // during edge creation - the whole area is considered a hit
        return layout.containsWithEps(p, inputModeContext.hitTestRadius);
      }
      const innerWidth = layout.width - BORDER_THICKNESS2;
      const innerHeight = layout.height - HEADER_THICKNESS - BORDER_THICKNESS;
      const innerLayout = new Rect(
        layout.x + BORDER_THICKNESS,
        layout.y + HEADER_THICKNESS,
        innerWidth,
        innerHeight
      ).getEnlarged(-inputModeContext.hitTestRadius);

      return (
        layout.containsWithEps(p, inputModeContext.hitTestRadius) &&
        !innerLayout.contains(p)
      );
    }
  }

  isInBox(inputModeContext, box, node) {
    return (
      box.contains(node.layout.topLeft) && box.contains(node.layout.bottomRight)
    );
  }

  /**
   * Gets the outline of the node, a round rect in this case.
   * @param {INode} node
   * @return {GeneralPath}
   */
  getOutline(node) {
    const path = new GeneralPath();
    path.appendRectangle(node.layout, false);
    return path;
  }

  /**
   * Returns whether or not the given group node is collapsed.
   */
  private isCollapsed(node, gc) {
    if (!(gc instanceof GraphComponent)) {
      return false;
    }
    const foldedGraph = gc.graph.foldingView;
    // check if given node is in graph
    if (foldedGraph === null || !foldedGraph.graph.contains(node)) {
      return false;
    }
    // check if the node really is a group in the master graph
    return !foldedGraph.isExpanded(node);
  }
}
