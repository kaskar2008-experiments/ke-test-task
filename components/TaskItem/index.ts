import Vue from 'vue';
import { prop } from '~/plugins';
import { traverseDeep, setTaskVisibility } from '~/pages';

export interface ITaskItem {
  _uid: string;
  createdAt: number;
  title: string;
  description: string;
  children: ITaskItem[];
  isDone: boolean;
  parent: Partial<ITaskItem> | null;
  visible: boolean;
}

export default Vue.extend({
  name: 'task-item',
  props: {
    task: prop<ITaskItem>({
      type: Object,
    }),
  },
  data() {
    return {
      newTitle: '',
      isTitleEdit: false,
    };
  },
  computed: {
    childrenFiltered() {
      return this.task.children.filter(el => this.task.visible ? el.visible : true);
    },
  },
  methods: {
    startEditTitle() {
      this.newTitle = this.task.title;
      this.isTitleEdit = true;
    },
    saveNewTitle() {
      this.task.title = this.newTitle;
      this.isTitleEdit = false;
    },
    removeTask() {
      this.$root.$emit('remove-task', this.task);
    },
    restoreTask() {
      traverseDeep(this.task, 'children', task => setTaskVisibility(task, true));
    },
    openTask() {
      this.$root.$emit('open-task', this.task);
    },
  },
  watch: {
    task: {
      handler(task: ITaskItem) {
        this.$root.$emit('update-task', task);
      },
      deep: true,
    },
  },
});
