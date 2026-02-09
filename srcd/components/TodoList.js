import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import DittoService from '../services/dittoServices';
import TodoItem from './TodoItem';

const TodoApp = () => {
    // const [ditto, setDitto] = useState(null);
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    console.log('Rendering TodoApp with todos:', todos);

    // useEffect(() => {
    //     // Initialize Ditto

    //     const dittoInstance = new Ditto({

    //         appID: 'e8efa4e5-acb9-4fd6-b64c-639c18a879d7',
    //         identity: {
    //             type: 'onlinePlayground',
    //         },
    //         // token: '1fd1e8b1-f64e-49e0-ba60-624b4ff1ec2b'
    //     });

    //     // dittoInstance.startSync();
    //     setDitto(dittoInstance);

    //     // Query and observe todos
    //     const subscription = dittoInstance.store
    //         .collection('todos')
    //         .find('!isDeleted')
    //         .observe((docs) => {
    //             setTodos(docs);
    //         });

    //     return () => {
    //         subscription.stop();
    //         dittoInstance.stopSync();
    //     };
    // }, []); 

    useEffect(() => {
        let observerId;

        (async () => {
            try {
                const ditto = await DittoService.getInstance();
                

                // ensure cloud/transport sync is started and awaited
                // try {
                //     await DittoService.connectCloudAsync();
                // } catch (e) {
                //     console.warn('connectCloudAsync failed, continuing with local transports', e);
                // }

                // presence logging for debugging peers
                try {
                    if (ditto.presence && typeof ditto.presence.observe === 'function') {
                        ditto.presence.observe((graph) => {
                            console.log('Remote peers (TodoList):', graph.remotePeers);
                        });
                    }
                } catch (e) {
                    console.warn('presence.observe failed in component', e);
                }

                // registerObserver takes (queryString, callback) and returns an id
                observerId = ditto.store.registerObserver(
                    "SELECT * FROM tasks",
                    (res) => {
                        console.log('Observer query result', res);
                        if (res.items && res.items.length >= 0) {
                            const items = res.rows || res.items || [];
                            const tasks = items.map(item => ({ _id: item._id, value: item.text?.value || item.value }));
                            setTodos(tasks);
                        } else {
                            console.error('Observer query error', res && res.error);
                        }
                    }
                );
            } catch (err) {
                console.error('init/registerObserver failed', err);
            }
        })();
        return () => {
        
            try {
                const ditto = DittoService.getDittoInstance();
                if (ditto && observerId) {
                    ditto.store.unregisterObserver(observerId);
                }
            } catch (e) {
                console.warn('Failed to unregister observer', e);
            }
        };
    }, []);

    const deleteTodo = async (todoItem) => {
        console.log('Deleting todo item:', todoItem._id);
        try {
            const ditto = await DittoService.getInstance();
            if (!ditto) {
                console.warn('Ditto not initialized yet');
                return;
            } 
            await ditto.store.execute(
                'DELETE FROM tasks WHERE _id = :id',
                { id: todoItem._id }
            );
        } catch (err) {
            console.error('deleteTodo failed', err);
        } 
    }; 

    const addTodo = async () => {
        try {
            const ditto = await DittoService.getInstance();
            if (!ditto) {
                console.warn('Ditto not initialized yet');
                return;
            }
            if (!newTodo.trim()) return;
            console.log('Inserting new todo:', newTodo);
            await ditto.store.execute(
                'INSERT INTO tasks DOCUMENTS (:text)',
                { text: { value: newTodo } }
            );

            setNewTodo('');
        } catch (err) {
            console.error('addTodo failed', err);
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                value={newTodo}
                onChangeText={setNewTodo}
                placeholder="Add a todo"
            />
            <Button title="Add" onPress={addTodo} />

            <FlatList
                data={todos}
                keyExtractor={(item, index) =>
                    item._id || item.id || (item.value && (item.value._id || item.value.id)) || String(index)
                }
                renderItem={({ item }) => {
                   
                    let text = '';
                    const todoItemobj = item.value; 
                    console.log('Rendering item with value:', todoItemobj);
                    return <TodoItem todoItem={todoItemobj } onDelete={deleteTodo} />;
                }}
                ListEmptyComponent={<Text style={{ color: '#999', marginTop: 20 }}>No todos yet.</Text>}
            />
        </View>
    );
};

export default TodoApp;