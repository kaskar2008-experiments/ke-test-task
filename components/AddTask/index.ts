import Vue from 'vue';
import { ITaskItem } from '../TaskItem';
import { prop } from '~/plugins';

export default Vue.extend({
  name: 'add-task',
  props: {
    parent: prop<ITaskItem | null>({
      type: Object,
    }),
  },
  data() {
    return {
      newTask: '',
    };
  },
  methods: {
    createTask(title: string) {
      const createdAt = new Date().getTime();
      const newTask: ITaskItem = {
        _uid: `${createdAt}-${Math.random()}`,
        createdAt,
        title,
        description: '',
        children: [],
        isDone: false,
        visible: true,
        parent: this.parent ? {
          title: this.parent.title,
          _uid: this.parent._uid,
        } : null,
      };

      this.$root.$emit('add-task', newTask, this.parent);
    },
    addTask() {
      this.createTask(this.newTask);
      this.newTask = '';
    },
  },
});
