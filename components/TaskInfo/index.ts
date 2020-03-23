import Vue from 'vue';
import { prop } from '~/plugins';
import TaskItem, { ITaskItem } from '../TaskItem';
import AddTask from '../AddTask';
import { IProjectBroadcastInfo } from '~/pages';

export default Vue.extend({
  name: 'task-info',
  props: {
    task: prop<ITaskItem>({
      type: Object,
    }),
    project: prop<IProjectBroadcastInfo>({
      type: Object,
    }),
    projectList: prop<IProjectBroadcastInfo[]>({
      type: Array,
      default: () => ([]),
    }),
  },
  components: {
    AddTask,
    TaskItem,
  },
  data() {
    return {
      newDescription: '',
      isDescriptionEdit: false,
      taskProject: this.project.uid,
    };
  },
  computed: {
    childrenFiltered() {
      return this.task.children
        .filter(el => this.task.visible ? el.visible : true)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
  },
  methods: {
    startEditDescription() {
      this.newDescription = this.task.description;
      this.isDescriptionEdit = true;
    },
    stopDescriptionEdit() {
      this.newDescription = this.task.description;
      this.isDescriptionEdit = false;
    },
    saveNewDescription() {
      this.task.description = this.newDescription;
      this.isDescriptionEdit = false;
    },
    removeTask() {
      this.$root.$emit('remove-task', this.task);
    },
    openParentTask() {
      this.$root.$emit('open-task-by-uid', this.task.parent?._uid);
    },
  },
  watch: {
    task: {
      handler(task: ITaskItem) {
        this.$root.$emit('update-task', task);
      },
      deep: true,
    },
    taskProject() {
      this.$root.$emit('task-movement', this.task, this.taskProject);
      this.$root.$emit('close-task');
    },
  },
});
