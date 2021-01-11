<template>
    <div>
        <div class="graph-component-container" ref="GraphComponentElement"></div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
    FoldingManager,
    GraphComponent,
    GraphEditorInputMode,
    GraphItemTypes,
    GroupingSupport,
    HierarchicLayout,
    IFoldingView,
    IGraph,
    INode,
    Insets,
    LayoutExecutor,
    License,
    ModifierKeys,
    NodeAlignmentPolicy,
    NodeSizeConstraintProvider,
    NodeStyleDecorationInstaller,
    Rect,
    ShapeNodeStyle,
    Size,
    StyleDecorationZoomPolicy,
    TemplateNodeStyle,
} from "yfiles";
import licenseData from "@/assets/license.json";
import { GroupStyle } from "@/shared/groupStyle";

@Component({})
export default class DiagramComponent extends Vue {
    $refs: {
        GraphComponentElement: HTMLDivElement;
    };
    graph!: IGraph;
    graphComponent!: GraphComponent;
    private foldingManager: FoldingManager;
    private foldingView: IFoldingView;
    private groupUtil: GroupingSupport;

    beforeMount() {
        this.setLicense();
    }

    mounted() {
        this.init();
        this.createSampleGraph();
    }

    init() {
        this.createComponent();

        this.setStyle();

        this.createInteractions();
    }

    private createInteractions() {
        const mode = new GraphEditorInputMode({
            allowGroupingOperations: false,
            allowAddLabel: false,
            allowAdjustGroupNodeSize: false,
            allowCreateBend: false,
            allowReparentNodes: false,
            allowCreateNode: false,
            showHandleItems: GraphItemTypes.NODE,
            focusableItems: GraphItemTypes.NONE,
            allowCreateEdge: true,
            allowEditLabel: false,
            allowDuplicate: false,
            movableItems: GraphItemTypes.NODE,
        });
        mode.navigationInputMode.autoGroupNodeAlignmentPolicy =
            NodeAlignmentPolicy.TOP_RIGHT;
        // Allow folding commands
        mode.navigationInputMode.allowCollapseGroup = true;
        mode.navigationInputMode.allowExpandGroup = true;

        this.foldingView.addGroupCollapsedListener((sender, evt) => {
            const groupNode = evt.item;
            const position = groupNode.layout.toPoint();
            this.foldingView.graph.setNodeLayout(
                groupNode,
                new Rect(position, new Size(120, 80))
            );
        });

        this.graphComponent.inputMode = mode;
    }

    createComponent() {
        this.graphComponent = new GraphComponent(this.$refs.GraphComponentElement);
        this.graph = this.graphComponent.graph;
        this.foldingManager = new FoldingManager(this.graph);

        this.foldingView = this.foldingManager.createFoldingView();
        this.graphComponent.graph = this.foldingView.graph;
        this.groupUtil = new GroupingSupport(this.foldingView.graph);
    }

    private setStyle() {
        this.graph.nodeDefaults.size = new Size(80, 70);
        this.graph.groupNodeDefaults.size = new Size(120, 80);

        // this makes sure the normal nodes cannot be resized indefinitely while the groups can
        this.foldingView.graph.decorator.nodeDecorator.sizeConstraintProviderDecorator.setFactory(
            (node) => {
                if (node.tag.isGroup) {
                    const util = this.groupUtil;

                    return new NodeSizeConstraintProvider(
                        new Size(120, 80),
                        Size.INFINITE,
                        util.calculateMinimumEnclosedArea(node)
                    );
                } else {
                    return new NodeSizeConstraintProvider(
                        new Size(120, 80),
                        new Size(500, 500),
                        Rect.EMPTY
                    );
                }
            }
        );
        this.graph.nodeDefaults.style = new TemplateNodeStyle("NodeTemplate");
        // the converters used in the template can be set like so
        TemplateNodeStyle.CONVERTERS.enabledConverter = (
            value: boolean,
            parameter: any
        ) => {
            // converts a bool into a color
            if (typeof value === "boolean") {
                return value === true ? "transparent" : "#FF0000";
            }
            return "#000000";
        };

        const nodeHighlightInstaller = new NodeStyleDecorationInstaller();
        nodeHighlightInstaller.zoomPolicy =
            StyleDecorationZoomPolicy.WORLD_COORDINATES;
        nodeHighlightInstaller.margins = new Insets(5);
        nodeHighlightInstaller.nodeStyle = new ShapeNodeStyle({
            shape: "round-rectangle",
            fill: null,
            stroke: "2px solid #2eae0d",
        });
        this.foldingView.graph.decorator.nodeDecorator.selectionDecorator.setImplementation(
            nodeHighlightInstaller
        );
        // this.graph.decorator.edgeDecorator.highlightDecorator.setImplementation(edgeHighlightInstaller);
    }

    setLicense() {
        License.value = licenseData;
    }

    layout() {
        const executor = new LayoutExecutor({
            graphComponent: this.graphComponent,
            layout: new HierarchicLayout({
                layoutOrientation: "left-to-right",
                gridSpacing: 0,
            }),
            animateViewport: true,
            easedAnimation: true,
            duration: "0.5s",
            fixPorts: true,
        });

        executor.start().then(() => {
            this.graphComponent.fitContent();
            this.graphComponent.zoom = 1;
        });
    }

    createSampleGraph() {
        const one = this.graph.createNode({
            tag: { name: "yWorks", isGroup: false },
        });
        const two = this.graph.createNode({
            tag: { name: "Diagrams", isGroup: false },
        });
        const edge = this.graph.createEdge(one, two);

        const groupStyle = new GroupStyle();
        groupStyle.isCollapsible = true;
        const group = this.graph.createGroupNode({
            style: groupStyle,
            tag: {
                name: "A lot of text and stuff here which should be wrapped",
                isGroup: true,
            },
        });

        this.graph.setParent(one, group);
        this.graph.adjustGroupNodeLayout(group);
        this.foldingView.collapse(group);
        this.layout();
    }
}
</script>

<style>
@import "../../node_modules/yfiles/yfiles.css";
html,
body {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
}

.graph-component-container {
    background-color: #dfeaf5;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
}

.flow-node-title {
    font-family: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 12px;
    fill: white;
}
</style>

<style scoped>

</style>
