import { Model} from '../models/model.model.js';


export const createModel = async (req, res) => {
    try {
        const { modelName } = req.body;

        const existingModel = await Model.findOne({modelName});
        if (existingModel) {
            return res.status(400).json({ error: 'Model already exists' });
        }

        const newModel = new Model({ modelName });
        await newModel.save();

        res.status(200).json({ message: 'Model added successfully', Model: newModel });
    } catch (error) {
        console.error('Error registering Model:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export const getModel = async (req, res) => {
    try {
        const models = await Model.find();
        res.status(200).json({"models":models});
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateModel = async (req, res) => {
    try {
        const { id } = req.params;
        const { modelName } = req.body;

        const updatedModel = await Model.findByIdAndUpdate(id, { modelName }, { new: true });

        if (!updatedModel) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.status(200).json({ message: 'Model updated successfully', model: updatedModel });
    } catch (error) {
        console.error('Error updating model:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteModel = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedModel = await Model.findByIdAndDelete(id);

        if (!deletedModel) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.status(200).json({ message: 'Model deleted successfully' });
    } catch (error) {
        console.error('Error deleting model:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

