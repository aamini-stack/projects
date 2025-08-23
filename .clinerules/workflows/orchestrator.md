<task name="Orchestrator Workflow">

<task_objective>

Analyze user requests and route them to specialized subagents based on task complexity and type. The workflow will receive task inputs, analyze their requirements, match them to appropriate subagents, and launch the selected subagents with proper parameters. The output will be a markdown file documenting the task analysis and routing decisions.

</task_objective>

<detailed_sequence_steps>

# Orchestrator Workflow - Detailed Sequence of Steps

## 1. Analyze Task Complexity and Requirements

1. Parse the incoming task request to extract key information
2. Analyze the task context and requirements using built-in analysis tools
3. Determine task complexity level (simple, moderate, complex)
4. Identify required capabilities and resources

## 2. Match Task to Appropriate Subagent

1. Maintain a registry of available subagents with their capabilities
2. Use capability matching algorithm to find best subagent fit
3. Consider subagent availability and current workload
4. Select primary subagent and identify backup options

## 3. Launch Selected Subagent with Task Parameters

1. Prepare task parameters and context for the selected subagent
2. Launch and monitor the subagent execution using built-in orchestration tools
3. Establish communication channels between orchestrator and subagent
4. Monitor subagent progress and handle any errors or timeouts
5. Collect and process results from subagent execution

</detailed_sequence_steps>

</task>
